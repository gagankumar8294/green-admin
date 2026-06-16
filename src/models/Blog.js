import mongoose from "mongoose";

const sectionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["h1", "h2", "h3", "paragraph", "image", "link"],
      required: true,
    },
    value: { type: String, required: true },
    alt: { type: String, default: "" },
    linkText: { type: String, default: "" },
    public_id: { type: String, default: "" },
  },
  { _id: false }
);

const blogSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    title: { type: String, required: true },
    category: {
      type: [
        {
          type: String,
          enum: [
            "flower-crops",
            "landscape",
            "nutritional-values",
            "mysteries-of-flower",
            "plants",
            "landscaping",
            "gardening",
            "indoor-plants",
            "outdoor-plants",
            "plant-care",
            "soil-and-fertilizers",
          ],
        }
      ],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "At least one category is required"
      },
      index: true,
    },
    metaDescription: { type: String, default: "" },
    ogTitle: { type: String, default: "" },
    ogDescription: { type: String, default: "" },
    ogImage: { type: String, default: "" },
    twitterTitle: { type: String, default: "" },
    twitterDescription: { type: String, default: "" },
    twitterImage: { type: String, default: "" },
    canonicalUrl: { type: String, default: "" },
    isDeleted: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true,
    },
    sections: {
      type: [sectionSchema],
      required: true,
      validate: {
        validator: (secs) => secs.some((s) => s.type === "h1"),
        message: "At least one H1 section is required",
      },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Blog || mongoose.model("Blog", blogSchema);
