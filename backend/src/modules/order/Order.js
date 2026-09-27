import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: String,
    slug: String,
    image: String,
    price: Number,
    quantity: { type: Number, min: 1 },
    color: String,
    size: String,
    note: String,
  },
  { _id: false },
);

export const ORDER_STATUSES = ["pending", "confirmed", "in_production", "shipped", "delivered", "cancelled"];

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    email: { type: String, required: true, lowercase: true, index: true },
    items: [itemSchema],
    shippingAddress: {
      fullName: String,
      phone: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: "India" },
    },
    coupon: { code: String, discount: Number },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    codFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["razorpay", "cod"], default: "razorpay" },
    paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending" },
    razorpay: {
      orderId: String,
      paymentId: String,
      signature: String,
    },
    status: { type: String, enum: ORDER_STATUSES, default: "pending", index: true },
    timeline: [
      {
        status: String,
        note: String,
        at: { type: Date, default: Date.now },
      },
    ],
    trackingNumber: String,
    courier: String,
    customerNote: String,
  },
  { timestamps: true },
);

export const Order = mongoose.model("Order", orderSchema);
