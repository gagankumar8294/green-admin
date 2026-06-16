import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Comment from "@/models/Comment";
import User from "@/models/User"; // populated model
import Blog from "@/models/Blog"; // populated model
import Product from "@/models/Product"; // populated model

export async function GET() {
  try {
    await connectDB();
    const comments = await Comment.find()
      .populate("user", "name image email")
      .populate("blog", "title slug")
      .populate("product", "name slug")
      .sort({ createdAt: -1 });

    return NextResponse.json(comments);
  } catch (err) {
    console.error("GET comments error:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
