const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Upload a JPG image file to backend (which uploads securely to Cloudinary)
 */
export async function uploadImage(file: File): Promise<string> {
  // 1. Client-side Image format check
  const isValidMime = file.type.startsWith("image/");
  const isValidExt = /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name);
  if (!isValidMime && !isValidExt) {
    throw new Error("Only image files are allowed.");
  }

  // 2. Client-side 10MB size limit check
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds maximum allowed limit of 10 MB.`);
  }

  // 3. Upload file directly to backend
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/upload`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const uploadData = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(uploadData.message || "Failed to upload image to backend");
  }

  return uploadData.url;
}
