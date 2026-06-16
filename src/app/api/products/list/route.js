import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const categories = searchParams.get("categories") || "";
    const sort = searchParams.get("sort") || "";
    const minPrice = searchParams.get("minPrice") || 0;
    const maxPrice = searchParams.get("maxPrice") || 999999;
    const all = searchParams.get("all") || "false";

    let filter = { isDeleted: { $ne: true } };

    if (all !== "true") {
      filter.status = { $ne: "draft" };
    }

    if (search.trim() !== "") {
      filter.name = { $regex: search.trim(), $options: "i" };
    }

    if (categories.trim() !== "") {
      const categoryArray = categories.split(",").map((c) => c.trim());
      filter.categories = { $in: categoryArray };
    }

    filter.price = {
      $gte: Number(minPrice),
      $lte: Number(maxPrice),
    };

    let sortOption = {};
    if (sort === "price_low_high") sortOption.price = 1;
    else if (sort === "price_high_low") sortOption.price = -1;
    else if (sort === "oldest") sortOption.createdAt = 1;
    else sortOption.createdAt = -1;

    const products = await Product.find(filter).sort(sortOption);

    return NextResponse.json({
      success: true,
      total: products.length,
      products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, message: "Server error while fetching products" },
      { status: 500 }
    );
  }
}
