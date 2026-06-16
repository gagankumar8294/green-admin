import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    price: { type: Number, required: true },
    mainImage: { type: String, required: true },
    mainImageAlt: { type: String, default: "" },
    subImages: [{ type: String }],
    subImagesAlt: [{ type: String }],
    description: { type: String, required: true },
    features: [{ type: String }],
    quantity: { type: Number, required: true },
    inStock: { type: Boolean, default: true },
    weight: { type: String, required: true },
    dimension: {
      length: { type: String, required: true },
      width: { type: String, required: true },
    },
    categories: { type: [String], required: true },
    status: { type: String, enum: ["draft", "public"], default: "public" },
    isDeleted: { type: Boolean, default: false }
  },
  { timestamps: true }
);

productSchema.pre("save", function () {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
  }
});

export default mongoose.models.Product || mongoose.model("Product", productSchema);
