import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    phone: { type: String, trim: true, default: "" },
    passwordHash: { type: String, select: false },
    role: { type: String, enum: ["customer", "seller", "superadmin"], default: "customer" },
    emailVerified: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true },
);

userSchema.methods.setPassword = async function setPassword(password) {
  this.passwordHash = await bcrypt.hash(password, 10);
};

userSchema.methods.comparePassword = function comparePassword(password) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(password, this.passwordHash);
};

// Note: addresses are now fetched externally by the service layer, but we keep the method signature similar
userSchema.methods.toPublic = function toPublic(addresses = []) {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    emailVerified: this.emailVerified,
    addresses: addresses,
  };
};

export const User = mongoose.model("User", userSchema);
