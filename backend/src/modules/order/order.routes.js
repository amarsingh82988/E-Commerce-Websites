import express from "express";
import {
  createOrder,
  verifyRazorpayPayment,
  getMyOrders,
  getOrderDetails,
} from "./order.controller.js";
import { userProtect, optionalUserProtect } from "../user/user.middleware.js";

const router = express.Router();

// Protected User Endpoints
router.post("/create", userProtect, createOrder);
router.post("/verify-payment", userProtect, verifyRazorpayPayment);
router.get("/my-orders", userProtect, getMyOrders);

// Order details lookup (User owner or guest lookup by number)
router.get("/:identifier", optionalUserProtect, getOrderDetails);

export default router;
