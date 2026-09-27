import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import { env, isConfigured } from "../config/env.js";

// Configure Cloudinary globally
if (isConfigured.cloudinary) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
}

/**
 * Extracts public_id from Cloudinary URL and deletes it.
 * Used for rolling back orphaned images when database operations fail.
 */
export async function deleteFromCloudinary(imageUrl) {
  if (!isConfigured.cloudinary || !imageUrl || !imageUrl.includes("cloudinary.com")) return;
  
  try {
    const parts = imageUrl.split("/upload/");
    if (parts.length !== 2) return;
    
    let path = parts[1];
    // Remove version tag (e.g., v1612345/) if present
    if (path.match(/^v\d+\//)) {
      path = path.replace(/^v\d+\//, "");
    }
    
    // Remove extension
    const publicId = path.substring(0, path.lastIndexOf("."));
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
      console.log(`[Rollback Success] Deleted orphaned image from Cloudinary: ${publicId}`);
    }
  } catch (error) {
    console.error("[Cloudinary Rollback Error] Failed to delete image:", error.message);
  }
}

/**
 * Uploads a file buffer to Cloudinary using a stream.
 */
export const uploadToCloudinary = (fileBuffer, folder = "apne-hath-crafts") => {
  return new Promise((resolve, reject) => {
    if (!isConfigured.cloudinary) {
      return reject(new Error("Cloudinary is not configured"));
    }
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};
