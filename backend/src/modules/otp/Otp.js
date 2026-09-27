import mongoose from "mongoose";
import crypto from "crypto";

const otpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, index: true },
    codeHash: { type: String, required: true },
    purpose: { type: String, enum: ["login", "verify", "login_admin"], default: "login" },
    attempts: { type: Number, default: 0 },
    consumedAt: Date,
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);

export const hashCode = (code) => crypto.createHash("sha256").update(String(code)).digest("hex");

export const Otp = mongoose.model("Otp", otpSchema);
