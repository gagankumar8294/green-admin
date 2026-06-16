import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const {
      name,
      price,
      mainImage,
      mainImageAlt,
      subImages,
      subImagesAlt,
      description,
      quantity,
      weight,
      dimension,
      categories,
      features,
      status,
    } = body;

    const newProduct = new Product({
      name,
      price: Number(price),
      mainImage,
      mainImageAlt,
      subImages,
      subImagesAlt,
      description,
      quantity: Number(quantity),
      weight,
      dimension,
      categories,
      features,
      status: status || "public",
    });

    await newProduct.save();

    return NextResponse.json({
      success: true,
      message: "Product added successfully",
      product: newProduct,
    }, { status: 201 });
  } catch (error) {
    console.error("Error adding product:", error);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
