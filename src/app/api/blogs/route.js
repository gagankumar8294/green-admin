import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Blog from "@/models/Blog";

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const all = searchParams.get("all") || "false";

    const filter = { isDeleted: false };
    if (all !== "true") {
      filter.status = { $ne: "draft" };
    }

    const blogs = await Blog.find(filter).sort({ createdAt: -1 });
    return NextResponse.json(blogs);
  } catch (err) {
    console.error("GET blogs error:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { title, slug, category, sections, status } = body;

    if (!title || !slug || !category || (Array.isArray(category) && category.length === 0) || !sections?.length) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    const h1Exists = sections.some((s) => s.type === "h1");
    if (!h1Exists) {
      return NextResponse.json({ message: "H1 section is required" }, { status: 400 });
    }

    const invalidImage = sections.some(
      (s) => s.type === "image" && (!s.value || !s.alt)
    );
    if (invalidImage) {
      return NextResponse.json({ message: "Image alt text is required" }, { status: 400 });
    }

    const firstParagraph = sections.find((s) => s.type === "paragraph")?.value || "";
    const firstImage = sections.find((s) => s.type === "image") || {};

    const blog = await Blog.create({
      title,
      slug: slug.toLowerCase().trim().replace(/\s+/g, "-"),
      category,
      sections,
      status: status || "draft",
      metaDescription: firstParagraph.slice(0, 160),
      ogTitle: title,
      ogDescription: firstParagraph.slice(0, 160),
      ogImage: firstImage.value || "",
      twitterTitle: title,
      twitterDescription: firstParagraph.slice(0, 160),
      twitterImage: firstImage.value || "",
      canonicalUrl: `https://www.happygreenery.in/blog/${slug}`,
    });

    return NextResponse.json(blog, { status: 201 });
  } catch (err) {
    console.error("POST blogs error:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
