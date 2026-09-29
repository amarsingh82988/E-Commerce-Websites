import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  storeName: { type: String, default: "Apne Hath Crafts" },
  contactEmail: String,
  phone: String,
  address: String,
  socialLinks: { type: Map, of: String },
  paymentGateway: {
    provider: { type: String, default: "razorpay" },
    publicKey: String,
    privateKey: String,
    webhookSecret: String,
  },
  shipping: {
    fee: { type: Number, default: 79 },
    freeThreshold: { type: Number, default: 1499 },
    codFee: { type: Number, default: 49 },
  }
}, { timestamps: true });

export const Settings = mongoose.model("Settings", settingsSchema);
