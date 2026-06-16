import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Blog from "@/models/Blog";

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const deleted = await Blog.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ message: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Blog permanently deleted successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
