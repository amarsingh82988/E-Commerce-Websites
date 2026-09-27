import mongoose from "mongoose";
import { Review } from "./Review.js";
import { Product } from "../product/Product.js";
import { Order } from "../order/Order.js";
import { deleteFromCloudinary } from "../../utils/cloudinary.service.js";

/** Helper function to update product average rating & review count */
async function updateProductRatingStats(productId, session = null) {
  try {
    const approvedReviews = await Review.find({ product: productId, isApproved: true }).session(session).lean();
    const count = approvedReviews.length;
    const avg = count > 0 ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / count : 0;
    
    await Product.findByIdAndUpdate(productId, {
      rating: Number(avg.toFixed(1)),
      reviewCount: count,
    }, { session });
  } catch (err) {
    console.error("Error updating product rating stats:", err);
  }
}

/** Submit a review (Only logged-in verified buyers) */
export async function createReview(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required to post a review." });
    }

    const { productId, rating, title, comment, images } = req.body;

    if (!productId || !rating || !comment) {
      return res.status(400).json({ message: "Product ID, rating (1-5), and comment are required." });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "Rating must be a number between 1 and 5." });
    }

    // Find target product by ObjectId or Slug
    let productDoc = await Product.findById(productId).lean();
    if (!productDoc) {
      productDoc = await Product.findOne({ slug: String(productId).toLowerCase() }).lean();
    }

    if (!productDoc) {
      return res.status(404).json({ message: "Product not found." });
    }

    const userId = req.user._id || req.user.id;
    const userEmail = req.user.email?.toLowerCase();

    // Verify user has purchased this product
    const purchasedOrder = await Order.findOne({
      $and: [
        { $or: [{ user: userId }, { email: userEmail }] },
        { status: { $ne: "cancelled" } },
        {
          $or: [
            { "items.product": productDoc._id },
            { "items.slug": productDoc.slug },
          ],
        },
      ],
    }).lean();

    if (!purchasedOrder) {
      return res.status(403).json({
        message: "Only verified buyers who have purchased this product can leave a review.",
      });
    }

    // Check for existing review by this user for this product
    const existingReview = await Review.findOne({ product: productDoc._id, user: userId }).lean();
    if (existingReview) {
      return res.status(400).json({ message: "You have already submitted a review for this product." });
    }

    // Create new review (pending seller approval)
    const review = new Review({
      product: productDoc._id,
      user: userId,
      userName: req.user.name || "Verified Buyer",
      userEmail: userEmail,
      rating: numericRating,
      title: title ? title.trim() : "",
      comment: comment.trim(),
      images: Array.isArray(images) ? images : [],
      isApproved: false,
    });

    await review.save();

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully! It will appear on the product page once approved by the seller.",
      review,
    });
  } catch (err) {
    console.error("Error creating review:", err);
    if (req.body.images && Array.isArray(req.body.images)) {
      for (const img of req.body.images) {
        await deleteFromCloudinary(img);
      }
    }
    return res.status(500).json({ message: "Failed to submit review." });
  }
}

/** Get approved reviews for a product (and current user's pending review if logged in) */
export async function getProductReviews(req, res) {
  try {
    const { productId } = req.params;

    let productDoc = await Product.findById(productId).lean();
    if (!productDoc) {
      productDoc = await Product.findOne({ slug: String(productId).toLowerCase() }).lean();
    }

    if (!productDoc) {
      return res.status(404).json({ message: "Product not found." });
    }

    // Publicly return only approved reviews
    const approvedReviews = await Review.find({ product: productDoc._id, isApproved: true })
      .sort({ createdAt: -1 })
      .lean();

    // If user is logged in, check if they have a pending review to show them their status
    let userPendingReview = null;
    if (req.user) {
      const userId = req.user._id || req.user.id;
      userPendingReview = await Review.findOne({
        product: productDoc._id,
        user: userId,
        isApproved: false,
      }).lean();
    }

    return res.json({
      approved: approvedReviews,
      userPending: userPendingReview,
      totalApproved: approvedReviews.length,
    });
  } catch (err) {
    console.error("Error fetching product reviews:", err);
    return res.status(500).json({ message: "Failed to fetch reviews." });
  }
}

/** Get all pending reviews requiring seller approval */
export async function getPendingReviews(req, res) {
  try {
    const pendingReviews = await Review.find({ isApproved: false })
      .populate("product", "name slug featuredImage price")
      .sort({ createdAt: -1 })
      .lean();

    return res.json(pendingReviews);
  } catch (err) {
    console.error("Error fetching pending reviews:", err);
    return res.status(500).json({ message: "Failed to fetch pending reviews." });
  }
}

/** Approve a review (Seller / Admin permission) */
export async function approveReview(req, res) {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const { id } = req.params;
    const review = await Review.findByIdAndUpdate(id, { isApproved: true, approvedAt: new Date() }, { new: true, session });
    if (!review) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Review not found." });
    }
    await updateProductRatingStats(review.product, session);
    await session.commitTransaction();
    session.endSession();
    return res.json({ success: true, message: "Review approved successfully!", review });
  } catch (err) {
    if (session) { await session.abortTransaction(); session.endSession(); }
    console.error("Error approving review:", err);
    return res.status(500).json({ message: "Failed to approve review." });
  }
}

export async function replyToReview(req, res) {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    if (!reply || !reply.trim()) {
      return res.status(400).json({ message: "Reply text is required." });
    }

    const review = await Review.findByIdAndUpdate(
      id,
      { sellerReply: reply.trim(), sellerRepliedAt: new Date() },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ message: "Review not found." });
    }

    return res.json({ success: true, message: "Reply saved", review });
  } catch (err) {
    console.error("Error replying to review:", err);
    return res.status(500).json({ message: "Failed to save reply." });
  }
}

/** Delete / Reject Review */
export async function deleteReview(req, res) {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
    const { id } = req.params;
    const review = await Review.findByIdAndDelete(id, { session });
    if (!review) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Review not found." });
    }
    if (review.isApproved) {
      await updateProductRatingStats(review.product, session);
    }
    await session.commitTransaction();
    session.endSession();
    
    if (review.images && Array.isArray(review.images)) {
      for (const img of review.images) {
        await deleteFromCloudinary(img);
      }
    }
    return res.json({ success: true, message: "Review deleted successfully." });
  } catch (err) {
    if (session) { await session.abortTransaction(); session.endSession(); }
    console.error("Error deleting review:", err);
    return res.status(500).json({ message: "Failed to delete review." });
  }
}
