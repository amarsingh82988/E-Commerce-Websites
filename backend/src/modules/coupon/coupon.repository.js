import { Coupon } from "../../models/Coupon.js";

export async function findValidCouponByCode(code) {
  return await Coupon.findOne({
    code: code.toUpperCase(),
    isActive: true,
  }).exec();
}

export async function createCoupon(couponData) {
  couponData.code = couponData.code.toUpperCase();
  const coupon = new Coupon(couponData);
  return await coupon.save();
}

export async function incrementCouponUsage(id) {
  return await Coupon.findByIdAndUpdate(id, { $inc: { usedCount: 1 } }, { new: true }).exec();
}

export const couponRepository = {
  findValidCouponByCode,
  createCoupon,
  incrementCouponUsage,
};
