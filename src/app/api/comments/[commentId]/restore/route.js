import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Comment from "@/models/Comment";

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { commentId } = await params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ message: "Comment not found" }, { status: 404 });
    }

    comment.isDeleted = false;
    await comment.save();

    if (!comment.parentComment) {
      await Comment.updateMany({ parentComment: commentId }, { $set: { isDeleted: false } });
    }

    return NextResponse.json({ success: true, message: "Comment restored successfully" });
  } catch (err) {
    console.error("Restore comment error:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
