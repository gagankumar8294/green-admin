import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
  fullName: String,
  phone: String,
  street: String,
  city: String,
  state: String,
  pincode: String,
  country: { type: String, default: "India" }
});

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    image: { type: String },
    address: addressSchema
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", userSchema);
