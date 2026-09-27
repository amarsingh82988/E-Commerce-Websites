import express from "express";
import rateLimit from "express-rate-limit";
import { register, verifyEmail, loginStep1, loginStep2, forgotPassword, resetPassword, getProfile, updateProfile, logout, getCart, updateCart, getWishlist, updateWishlist,
} from "./user.controller.js";
import { userProtect, optionalUserProtect } from "./user.middleware.js";


const router = express.Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many authentication requests. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── User Auth (Public) ───────────────────────────────────────────────────
router.post("/register", authLimiter, register);
router.post("/verify-email", authLimiter, verifyEmail);
router.post("/login/step1", authLimiter, loginStep1);
router.post("/login/step2", authLimiter, loginStep2);
router.post("/logout", logout);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

// ── User Profile, Cart & Wishlist ─────────────────────────────────────────
router.get("/me", userProtect, getProfile);
router.put("/me", userProtect, updateProfile);

router.get("/cart", optionalUserProtect, getCart);
router.put("/cart", optionalUserProtect, updateCart);

router.get("/wishlist", optionalUserProtect, getWishlist);
router.put("/wishlist", optionalUserProtect, updateWishlist);

export default router;
