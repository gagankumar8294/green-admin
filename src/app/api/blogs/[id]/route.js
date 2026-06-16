import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Blog from "@/models/Blog";

export async function PUT(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    let { title, slug, category, sections, status } = body;

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

    slug = slug.toLowerCase().trim().replace(/\s+/g, "-");

    const updated = await Blog.findByIdAndUpdate(
      id,
      {
        title,
        slug,
        category,
        sections,
        status,
        metaDescription: firstParagraph.slice(0, 160),
        ogTitle: title,
        ogDescription: firstParagraph.slice(0, 160),
        ogImage: firstImage.value || "",
        twitterTitle: title,
        twitterDescription: firstParagraph.slice(0, 160),
        twitterImage: firstImage.value || "",
        canonicalUrl: `https://www.happygreenery.in/blog/${slug}`,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updated) {
      return NextResponse.json({ message: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PUT blog error:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const deleted = await Blog.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

    if (!deleted) {
      return NextResponse.json({ message: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Blog soft deleted successfully" });
  } catch (err) {
    console.error("DELETE blog error:", err);
    return NextResponse.json({ message: err.message }, { status: 500 });
  }
}
