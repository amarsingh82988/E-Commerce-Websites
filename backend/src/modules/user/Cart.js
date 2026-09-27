import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    qty: { type: Number, default: 1, min: 1 },
    color: { type: String, default: "" },
    size: { type: String, default: "" },
    note: { type: String, default: "" },
  },
  { _id: true, timestamps: false }
);

const cartSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    items: [cartItemSchema],
  },
  { timestamps: true }
);

export const Cart = mongoose.model("Cart", cartSchema);
