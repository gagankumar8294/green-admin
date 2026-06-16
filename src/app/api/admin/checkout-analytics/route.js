import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Order from "@/models/Order";
import User from "@/models/User"; // required for populate

export async function GET() {
  try {
    await connectDB();
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate("user", "name email image");

    return NextResponse.json({ success: true, orders });
  } catch (err) {
    console.error("Error fetching checkout analytics:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
