import express from "express";

import { env } from "../../config/env.js";

const router = express.Router();

import { sessionService } from "../session/session.service.js";

/**
 * Authentication Middleware for File Upload Route
 * Verifies session from HTTP-only cookies
 */
async function protectUpload(req, res, next) {
  const sessionId = req.cookies?.sessionId;

  if (!sessionId) {
    return res.status(401).json({ message: "Authentication required to upload files. Please log in." });
  }

  try {
    const session = await sessionService.verifyAndRefreshSession(sessionId);
    if (!session) {
      return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
    }
    req.user = { id: session.userId, role: session.role };
    next();
  } catch (_err) {
    return res.status(401).json({ message: "Authentication failed." });
  }
}

import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { uploadToCloudinary } from "../../utils/cloudinary.service.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

/**
 * POST /api/v1/upload - Upload file to backend, which streams to Cloudinary
 */
router.post("/", protectUpload, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const result = await uploadToCloudinary(req.file.buffer, "apne-hath-crafts");

    return res.json({
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
    });
  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return res.status(500).json({ message: err.message || "Failed to upload image" });
  }
});

/**
 * GET /api/v1/upload/signature - Generate a secure signature for direct frontend-to-Cloudinary upload
 */
router.get("/signature", protectUpload, (req, res) => {
  if (!env.cloudinary.apiSecret || !env.cloudinary.apiKey || !env.cloudinary.cloudName) {
    return res.status(500).json({ message: "Cloudinary is not configured." });
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = "apne-hath-crafts";

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    env.cloudinary.apiSecret
  );

  res.json({
    signature,
    timestamp,
    cloudName: env.cloudinary.cloudName,
    apiKey: env.cloudinary.apiKey,
    folder,
  });
});

export default router;
