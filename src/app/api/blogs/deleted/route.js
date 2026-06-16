import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Blog from "@/models/Blog";

export async function GET() {
  try {
    await connectDB();
    const blogs = await Blog.find({ isDeleted: true }).sort({ createdAt: -1 });
    return NextResponse.json(blogs);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
