import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Order from "@/models/Order";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import SessionFlow from "@/models/SessionFlow";

export async function GET() {
  try {
    await connectDB();

    // 1. Fetch all registered users
    const rawUsers = await User.find().sort({ createdAt: -1 }).lean();

    // 2. Fetch all orders, carts, and sessions in parallel for fast aggregation
    const [allOrders, allCarts, allSessions] = await Promise.all([
      Order.find().sort({ createdAt: -1 }).lean(),
      Cart.find().populate("items.productId", "name price mainImage").lean(),
      SessionFlow.find({ userId: { $exists: true, $ne: null } })
        .select("userId startedAt totalDuration events ip")
        .sort({ startedAt: -1 })
        .lean(),
    ]);

    // 3. Map orders by string userId
    const ordersByUser = {};
    for (const order of allOrders) {
      if (!order.user) continue;
      const uId = order.user.toString();
      if (!ordersByUser[uId]) ordersByUser[uId] = [];
      ordersByUser[uId].push(order);
    }

    // 4. Map carts by string userId
    const cartsByUser = {};
    for (const cart of allCarts) {
      if (!cart.user) continue;
      const uId = cart.user.toString();
      cartsByUser[uId] = cart;
    }

    // 5. Map sessions by string userId
    const sessionsByUser = {};
    for (const s of allSessions) {
      if (!s.userId) continue;
      const uId = s.userId.toString();
      if (!sessionsByUser[uId]) sessionsByUser[uId] = [];
      sessionsByUser[uId].push(s);
    }

    // 6. Build enriched user objects
    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    let totalLTV = 0;
    let activeBuyersCount = 0;
    let activeCartsCount = 0;
    let newUsersThisWeek = 0;

    const enrichedUsers = rawUsers.map((user) => {
      const uId = user._id.toString();
      const userOrders = ordersByUser[uId] || [];
      const userCart = cartsByUser[uId] || null;
      const userSessions = sessionsByUser[uId] || [];

      // Order calculations
      const paidOrders = userOrders.filter((o) => o.status === "PAID");
      const failedOrders = userOrders.filter(
        (o) => o.status === "FAILED" || o.status === "CANCELLED"
      );
      const pendingOrders = userOrders.filter((o) => o.status === "PENDING");

      const userSpent = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      totalLTV += userSpent;

      if (paidOrders.length > 0) {
        activeBuyersCount++;
      }

      const regTime = new Date(user.createdAt).getTime();
      if (regTime >= sevenDaysAgo) {
        newUsersThisWeek++;
      }

      // Cart calculations
      let cartItemsCount = 0;
      let cartTotal = 0;
      let cartItems = [];
      let hasActiveCart = false;

      if (userCart && Array.isArray(userCart.items) && userCart.items.length > 0) {
        cartItems = userCart.items
          .filter((item) => item.productId)
          .map((item) => ({
            productId: item.productId._id,
            name: item.productId.name,
            price: item.productId.price,
            image: item.productId.mainImage,
            quantity: item.quantity,
          }));

        cartItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

        if (cartItemsCount > 0) {
          hasActiveCart = true;
          activeCartsCount++;
        }
      }

      // Last active date resolution
      const dates = [
        user.createdAt ? new Date(user.createdAt) : null,
        user.updatedAt ? new Date(user.updatedAt) : null,
        userOrders[0]?.createdAt ? new Date(userOrders[0].createdAt) : null,
        userCart?.updatedAt ? new Date(userCart.updatedAt) : null,
        userSessions[0]?.startedAt ? new Date(userSessions[0].startedAt) : null,
      ].filter(Boolean);

      const lastActive = dates.length > 0
        ? new Date(Math.max(...dates.map((d) => d.getTime())))
        : user.createdAt;

      return {
        _id: user._id,
        name: user.name || "Unnamed User",
        email: user.email,
        image: user.image || "",
        googleId: user.googleId || "",
        registeredAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastActive,
        address: user.address || null,

        // E-Commerce Metrics
        metrics: {
          totalOrders: userOrders.length,
          paidOrdersCount: paidOrders.length,
          failedOrdersCount: failedOrders.length,
          pendingOrdersCount: pendingOrders.length,
          totalSpent: userSpent,
          averageOrderValue: paidOrders.length > 0 ? Math.round(userSpent / paidOrders.length) : 0,
          lastOrderDate: userOrders[0]?.createdAt || null,
        },

        // Orders summary list (for drawer/modal view)
        orders: userOrders.map((o) => ({
          _id: o._id,
          totalAmount: o.totalAmount,
          status: o.status,
          orderStatus: o.orderStatus,
          createdAt: o.createdAt,
          itemsCount: o.items?.length || 0,
          items: o.items || [],
        })),

        // Cart state
        cart: {
          hasActiveCart,
          itemsCount: cartItemsCount,
          total: cartTotal,
          items: cartItems,
          abandonedReminderSent: userCart?.abandonedReminderSent || false,
          updatedAt: userCart?.updatedAt || null,
        },

        // Session & Analytics
        sessions: {
          totalSessions: userSessions.length,
          latestIp: userSessions[0]?.ip || "",
          latestSessionDate: userSessions[0]?.startedAt || null,
        },
      };
    });

    return NextResponse.json({
      success: true,
      summary: {
        totalUsers: rawUsers.length,
        totalLTV,
        activeBuyers: activeBuyersCount,
        activeCarts: activeCartsCount,
        newUsersThisWeek,
      },
      users: enrichedUsers,
    });
  } catch (err) {
    console.error("Error fetching registered users:", err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
