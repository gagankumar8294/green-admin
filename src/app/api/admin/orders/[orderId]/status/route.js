import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { orderId } = await params;
    const { orderStatus } = await request.json();

    const timelineMap = {
      ORDERED: "orderedAt",
      SHIPPED: "shippedAt",
      PICKED: "pickedAt",
      ARRIVED: "arrivedAt",
      DELIVERED: "deliveredAt",
    };

    const update = {
      orderStatus,
      [`orderTimeline.${timelineMap[orderStatus]}`]: new Date(),
    };

    const order = await Order.findByIdAndUpdate(orderId, update, {
      new: true,
    }).populate("user", "name email image");

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order });
  } catch (err) {
    console.error("Error updating order status:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
