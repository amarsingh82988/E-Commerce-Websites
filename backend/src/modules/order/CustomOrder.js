import mongoose from "mongoose";

const customOrderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, trim: true, default: "" },
    type: { type: String, required: true },
    budget: { type: String, default: "" },
    deadline: { type: String, default: "" },
    colors: { type: String, default: "" },
    size: { type: String, default: "" },
    details: { type: String, required: true },
    referenceImage: { type: String, default: "" },
    status: {
      type: String,
      enum: ["requested", "in_review", "quoted", "accepted", "rejected", "completed"],
      default: "requested",
    },
    quoteAmount: { type: Number, default: 0 },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export const CustomOrder = mongoose.model("CustomOrder", customOrderSchema);
