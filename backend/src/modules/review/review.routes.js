import express from "express";
import {
  createReview,
  getProductReviews,
  getPendingReviews,
  approveReview,
  replyToReview,
  deleteReview,
} from "./review.controller.js";
import { userProtect, optionalUserProtect } from "../user/user.middleware.js";

const router = express.Router();

// Public / Optional Auth (Get approved reviews for product)
router.get("/product/:productId", optionalUserProtect, getProductReviews);

// Protected (Buyer submit review)
router.post("/", userProtect, createReview);

// Protected (Seller / Admin moderation)
router.get("/pending", userProtect, getPendingReviews);
router.put("/:id/approve", userProtect, approveReview);
router.put("/:id/reply", userProtect, replyToReview);
router.delete("/:id", userProtect, deleteReview);

export default router;
