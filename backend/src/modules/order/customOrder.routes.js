import express from "express";
import {
  createCustomOrder,
  getMyCustomOrders,
  getAllCustomOrders,
  updateCustomOrder,
} from "./customOrder.controller.js";
import { userProtect } from "../user/user.middleware.js";

const router = express.Router();

// Customer Endpoints (Protected: only logged-in users)
router.post("/", userProtect, createCustomOrder);
router.get("/my-orders", userProtect, getMyCustomOrders);

// Admin / Management Endpoints
router.get("/", userProtect, getAllCustomOrders);
router.put("/:id", userProtect, updateCustomOrder);

export default router;
