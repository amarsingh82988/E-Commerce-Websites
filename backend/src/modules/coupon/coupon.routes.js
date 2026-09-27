import express from "express";
import {
  createCoupon,
  getAllCoupons,
  updateCoupon,
  deleteCoupon,
  applyCoupon,
} from "./coupon.controller.js";
import { userProtect, optionalUserProtect } from "../user/user.middleware.js";

const router = express.Router();

// Public / Customer validation endpoint
router.post("/apply", optionalUserProtect, applyCoupon);

// Protected Seller / Admin endpoints
router.post("/", userProtect, createCoupon);
router.get("/", userProtect, getAllCoupons);
router.put("/:id", userProtect, updateCoupon);
router.delete("/:id", userProtect, deleteCoupon);

export default router;
