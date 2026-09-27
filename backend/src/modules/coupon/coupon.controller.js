import { Coupon } from "./Coupon.js";

/** Create a new Coupon (Seller / Admin) */
export async function createCoupon(req, res) {
  try {
    const {
      code,
      description,
      type,
      value,
      minOrderValue,
      maxDiscount,
      usageLimit,
      startsAt,
      expiresAt,
      isActive,
      appliesTo,
      category,
      products,
    } = req.body;

    if (!code || value === undefined) {
      return res.status(400).json({ message: "Coupon code and discount value are required." });
    }

    const cleanCode = code.trim().toUpperCase();

    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      return res.status(409).json({ message: `Coupon code "${cleanCode}" already exists.` });
    }

    const coupon = new Coupon({
      code: cleanCode,
      description: description ? description.trim() : "",
      type: type === "flat" ? "flat" : "percent",
      value: Number(value),
      minOrderValue: minOrderValue ? Number(minOrderValue) : 0,
      maxDiscount: maxDiscount ? Number(maxDiscount) : 0,
      usageLimit: usageLimit ? Number(usageLimit) : 0,
      startsAt: startsAt ? new Date(startsAt) : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      isActive: isActive !== false,
      appliesTo: ["all", "category", "products"].includes(appliesTo) ? appliesTo : "all",
      category: appliesTo === "category" && category ? category : null,
      products: appliesTo === "products" && Array.isArray(products) ? products : [],
    });

    await coupon.save();

    return res.status(201).json({
      success: true,
      message: `Coupon "${cleanCode}" created successfully!`,
      coupon,
    });
  } catch (err) {
    console.error("Error creating coupon:", err);
    return res.status(500).json({ message: "Failed to create coupon." });
  }
}

/** Get all Coupons (Seller / Admin) */
export async function getAllCoupons(req, res) {
  try {
    const coupons = await Coupon.find()
      .populate("category", "name slug")
      .populate("products", "name slug price")
      .sort({ createdAt: -1 })
      .lean();
    return res.json(coupons);
  } catch (err) {
    console.error("Error fetching coupons:", err);
    return res.status(500).json({ message: "Failed to fetch coupons." });
  }
}

/** Update Coupon (Seller / Admin) */
export async function updateCoupon(req, res) {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.code) {
      updates.code = updates.code.trim().toUpperCase();
    }

    const coupon = await Coupon.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate("category", "name slug")
      .populate("products", "name slug price");

    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found." });
    }

    return res.json({ success: true, message: "Coupon updated successfully!", coupon });
  } catch (err) {
    console.error("Error updating coupon:", err);
    return res.status(500).json({ message: "Failed to update coupon." });
  }
}

/** Delete Coupon (Seller / Admin) */
export async function deleteCoupon(req, res) {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return res.status(404).json({ message: "Coupon not found." });
    }
    return res.json({ success: true, message: "Coupon deleted successfully." });
  } catch (err) {
    console.error("Error deleting coupon:", err);
    return res.status(500).json({ message: "Failed to delete coupon." });
  }
}

/** Apply & Validate Coupon (Public / Customer Checkout) */
export async function applyCoupon(req, res) {
  try {
    const { code, subtotal, items } = req.body;

    if (!code) {
      return res.status(400).json({ message: "Coupon code is required." });
    }

    const cleanCode = code.trim().toUpperCase();
    const subtotalNum = Number(subtotal) || 0;

    const coupon = await Coupon.findOne({ code: cleanCode });
    if (!coupon) {
      return res.status(404).json({ message: "Invalid coupon code." });
    }

    const validationError = coupon.isValidNow(subtotalNum, items);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const discountAmount = coupon.discountFor(subtotalNum, items);

    return res.json({
      valid: true,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountAmount,
      minOrderValue: coupon.minOrderValue,
      appliesTo: coupon.appliesTo,
      message: `Coupon "${coupon.code}" applied successfully! You save ₹${discountAmount}.`,
    });
  } catch (err) {
    console.error("Error applying coupon:", err);
    return res.status(500).json({ message: "Failed to validate coupon." });
  }
}
