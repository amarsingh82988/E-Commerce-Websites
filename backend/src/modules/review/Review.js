import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    userName: { type: String, required: true, trim: true },
    userEmail: { type: String, required: true, trim: true, lowercase: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: "", trim: true },
    comment: { type: String, required: true, trim: true },
    images: [{ type: String }],
    isApproved: { type: Boolean, default: false, index: true },
    approvedAt: { type: Date, default: null },
    sellerReply: { type: String, default: "" },
    sellerRepliedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Review = mongoose.model("Review", reviewSchema);
