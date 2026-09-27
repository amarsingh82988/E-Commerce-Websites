import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    description: { type: String, default: "" },
    type: { type: String, enum: ["percent", "flat"], default: "percent" },
    value: { type: Number, required: true, min: 0 },
    minOrderValue: { type: Number, default: 0 },
    maxDiscount: { type: Number, default: 0 },
    usageLimit: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    startsAt: Date,
    expiresAt: Date,
    isActive: { type: Boolean, default: true },

    // Category / Product Scope
    appliesTo: { type: String, enum: ["all", "category", "products"], default: "all" },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  },
  { timestamps: true }
);

couponSchema.methods.isValidNow = function isValidNow(subtotal, items = []) {
  const now = new Date();
  if (!this.isActive) return "This coupon is no longer active.";
  if (this.startsAt && now < this.startsAt) return "This coupon is not active yet.";
  if (this.expiresAt && now > this.expiresAt) return "This coupon has expired.";
  if (this.usageLimit && this.usedCount >= this.usageLimit) return "This coupon has reached its maximum usage limit.";
  if (subtotal < this.minOrderValue) return `Add items worth ₹${this.minOrderValue} or more to use this coupon.`;

  // Validate scope applicability if items array is provided
  if (items && items.length > 0) {
    if (this.appliesTo === "category" && this.category) {
      const targetCatId = this.category.toString();
      const hasCategoryItem = items.some((it) => {
        const itemCat = it.product?.category?._id || it.product?.category || it.category;
        return itemCat && itemCat.toString() === targetCatId;
      });
      if (!hasCategoryItem) {
        return "This coupon is only valid for items in the specified category.";
      }
    } else if (this.appliesTo === "products" && this.products && this.products.length > 0) {
      const targetProductIds = this.products.map((p) => p.toString());
      const hasProductItem = items.some((it) => {
        const pId = it.product?._id || it.product || it.productId || it.id;
        return pId && targetProductIds.includes(pId.toString());
      });
      if (!hasProductItem) {
        return "This coupon is only valid for selected specific products.";
      }
    }
  }

  return null;
};

couponSchema.methods.discountFor = function discountFor(subtotal, items = []) {
  let eligibleSubtotal = subtotal;

  if (items && items.length > 0) {
    if (this.appliesTo === "category" && this.category) {
      const targetCatId = this.category.toString();
      eligibleSubtotal = items.reduce((sum, it) => {
        const itemCat = it.product?.category?._id || it.product?.category || it.category;
        if (itemCat && itemCat.toString() === targetCatId) {
          const price = it.price || it.product?.price || 0;
          const qty = it.quantity || it.qty || 1;
          return sum + price * qty;
        }
        return sum;
      }, 0);
    } else if (this.appliesTo === "products" && this.products && this.products.length > 0) {
      const targetProductIds = this.products.map((p) => p.toString());
      eligibleSubtotal = items.reduce((sum, it) => {
        const pId = it.product?._id || it.product || it.productId || it.id;
        if (pId && targetProductIds.includes(pId.toString())) {
          const price = it.price || it.product?.price || 0;
          const qty = it.quantity || it.qty || 1;
          return sum + price * qty;
        }
        return sum;
      }, 0);
    }
  }

  if (eligibleSubtotal <= 0) return 0;

  let discount = this.type === "percent" ? (eligibleSubtotal * this.value) / 100 : this.value;
  if (this.maxDiscount && this.maxDiscount > 0) {
    discount = Math.min(discount, this.maxDiscount);
  }
  return Math.min(Math.round(discount), eligibleSubtotal);
};

export const Coupon = mongoose.model("Coupon", couponSchema);
