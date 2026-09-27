import { fetchApi } from "@/lib/api";

export interface ReviewItem {
  _id: string;
  product: string | { _id: string; name: string; slug: string; featuredImage?: string; price?: number };
  user: string;
  userName: string;
  userEmail: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  isApproved: boolean;
  approvedAt?: string;
  sellerReply?: string;
  sellerRepliedAt?: string;
  createdAt: string;
}

export interface ProductReviewsResponse {
  approved: ReviewItem[];
  userPending: ReviewItem | null;
  totalApproved: number;
}

export async function getProductReviews(productId: string): Promise<ProductReviewsResponse> {
  return fetchApi(`/reviews/product/${productId}`);
}

export async function createReview(data: {
  productId: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
}): Promise<{ success: boolean; message: string; review: ReviewItem }> {
  return fetchApi("/reviews", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getPendingReviews(): Promise<ReviewItem[]> {
  return fetchApi("/reviews/pending");
}

export async function approveReview(id: string): Promise<{ success: boolean; message: string; review: ReviewItem }> {
  return fetchApi(`/reviews/${id}/approve`, {
    method: "PUT",
  });
}

export async function replyToReview(id: string, reply: string): Promise<{ success: boolean; message: string; review: ReviewItem }> {
  return fetchApi(`/reviews/${id}/reply`, {
    method: "PUT",
    body: JSON.stringify({ reply }),
  });
}

export async function deleteReview(id: string): Promise<{ success: boolean; message: string }> {
  return fetchApi(`/reviews/${id}`, {
    method: "DELETE",
  });
}
