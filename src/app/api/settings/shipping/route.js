import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Settings from "@/models/Settings";

export async function GET() {
  try {
    await connectDB();
    let settings = await Settings.findOne({ key: "shipping" });

    if (!settings) {
      settings = {
        key: "shipping",
        value: {
          minOrderForFreeShipping: 1000,
          defaultShippingFee: 79,
        },
      };
    }

    return NextResponse.json({ success: true, settings });
  } catch (err) {
    console.error("GET shipping settings error:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { value } = await request.json();

    if (value === undefined) {
      return NextResponse.json({ success: false, message: "Value is required" }, { status: 400 });
    }

    const settings = await Settings.findOneAndUpdate(
      { key: "shipping" },
      { value },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      settings,
    });
  } catch (err) {
    console.error("POST shipping settings error:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
