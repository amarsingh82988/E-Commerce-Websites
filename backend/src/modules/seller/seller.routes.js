import express from "express";
import rateLimit from "express-rate-limit";
import {
  sellerRegister, sellerVerifyEmail, sellerLoginStep1, sellerLoginStep2, sellerLogout, getDashboardStats,
  getAllProducts, createProduct, updateProduct, deleteProduct, toggleProductBadges,
  getCategories, createCategory, updateCategory, deleteCategory,
  getAllOrders, getOrderById, updateOrderStatus,
  getAllRequests, updateQuote, updateStatus, addUpdate,
} from "./seller.controller.js";

import { protectSeller } from "./seller.middleware.js";



const router = express.Router();

const sellerAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many requests. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Seller Auth (Public) ─────────────────────────────────────────────────
router.post("/register", sellerAuthLimiter, sellerRegister);
router.post("/verify-email", sellerAuthLimiter, sellerVerifyEmail);
router.post("/login/step1", sellerAuthLimiter, sellerLoginStep1);
router.post("/login/step2", sellerAuthLimiter, sellerLoginStep2);
router.post("/logout", sellerLogout);

// ── Seller Dashboard (Protected) ─────────────────────────────────────────
router.get("/dashboard/stats", protectSeller, getDashboardStats);

// ── Products — seller + superadmin ─────────────────────────────────────────
router.get("/products", protectSeller, getAllProducts);
router.post("/products", protectSeller, createProduct);

router.put("/products/:id", protectSeller, updateProduct);
router.delete("/products/:id", protectSeller, deleteProduct);
router.patch("/products/:id/badges", protectSeller, toggleProductBadges);

// ── Categories — seller  ───────────────────────────────────────
router.get("/categories", protectSeller, getCategories);
router.post("/categories", protectSeller, createCategory);
router.put("/categories/:id", protectSeller, updateCategory);
router.delete("/categories/:id", protectSeller, deleteCategory);


// ── Orders — seller + superadmin ───────────────────────────────────────────
router.get("/orders", protectSeller, getAllOrders);
router.get("/orders/:id", protectSeller, getOrderById);
router.put("/orders/:id/status", protectSeller, updateOrderStatus);

// ── Custom Orders — seller + superadmin ────────────────────────────────────
router.get("/custom-orders", protectSeller, getAllRequests);
router.put("/custom-orders/:id/quote", protectSeller, updateQuote);
router.put("/custom-orders/:id/status", protectSeller, updateStatus);
router.post("/custom-orders/:id/updates", protectSeller, addUpdate);



export default router;
