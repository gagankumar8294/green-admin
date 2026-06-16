import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const deleted = await Product.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Product soft deleted successfully" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
