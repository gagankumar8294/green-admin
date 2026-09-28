import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import SessionFlow from "@/models/SessionFlow";
import User from "@/models/User"; // populated model

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date"); // Format: YYYY-MM-DD
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || (date ? 50 : 15);
    const skip = (page - 1) * limit;
    const type = searchParams.get("type") || "all";
    const userId = searchParams.get("userId");
    const sessionId = searchParams.get("sessionId");

    let query = {};
    if (sessionId) {
      query.sessionId = sessionId;
    }
    if (userId) {
      query.userId = userId;
    } else if (type === "auth") {
      query.userId = { $ne: null };
    } else if (type === "anon") {
      query.userId = null;
    }

    if (date) {
      const [year, month, day] = date.split("-").map(Number);
      const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
      query.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    // When viewing a particular day, sort from morning to evening (earliest to latest in the day)
    const sortObj = date ? { createdAt: 1 } : { updatedAt: -1 };

    const sessions = await SessionFlow.find(query)
      .populate("userId", "name email image")
      .sort(sortObj)
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
