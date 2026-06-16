import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import SessionFlow from "@/models/SessionFlow";
import User from "@/models/User"; // populated model

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 15;
    const skip = (page - 1) * limit;
    const type = searchParams.get("type") || "all";
    const userId = searchParams.get("userId");

    let query = {};
    if (userId) {
      query.userId = userId;
    } else if (type === "auth") {
      query.userId = { $ne: null };
    } else if (type === "anon") {
      query.userId = null;
    }

    const sessions = await SessionFlow.find(query)
      .populate("userId", "name email image")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SessionFlow.countDocuments(query);

    return NextResponse.json({
      success: true,
      sessions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET analytics sessions error:", error);
    return NextResponse.json({ success: false, error: "Server error fetching sessions" }, { status: 500 });
  }
}
