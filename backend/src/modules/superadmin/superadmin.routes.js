import express from "express";
import rateLimit from "express-rate-limit";
import {
  adminLoginStep1,
  adminLoginStep2,
  adminForgotPassword,
  adminResetPassword,
  adminLogout,
} from "./superadmin.controller.js";
import { protectAdmin as _protectAdmin } from "./superadmin.middleware.js";


const router = express.Router();

const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: "Too many requests. Please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── SuperAdmin Auth (Public) ─────────────────────────────────────────────
router.post("/login/step1", adminAuthLimiter, adminLoginStep1);
router.post("/login/step2", adminAuthLimiter, adminLoginStep2);
router.post("/logout", adminLogout);
router.post("/forgot-password", adminAuthLimiter, adminForgotPassword);
router.post("/reset-password", adminAuthLimiter, adminResetPassword);

export default router;
