import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const restored = await Product.findByIdAndUpdate(id, { isDeleted: false }, { new: true });

    if (!restored) {
      return NextResponse.json(
        { success: false, message: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Product restored successfully",
      product: restored,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, message: err.message },
      { status: 500 }
    );
  }
}
