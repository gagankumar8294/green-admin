import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Blog from "@/models/Blog";

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const restored = await Blog.findByIdAndUpdate(id, { isDeleted: false }, { new: true });

    if (!restored) {
      return NextResponse.json({ message: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Blog restored successfully", blog: restored });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
