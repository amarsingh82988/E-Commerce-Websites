import { fetchApi } from "@/lib/api";

export interface CouponItem {
  _id: string;
  code: string;
  description?: string;
  type: "percent" | "flat";
  value: number;
  minOrderValue: number;
  maxDiscount: number;
  usageLimit: number;
  usedCount: number;
  startsAt?: string;
  expiresAt?: string;
  isActive: boolean;
  appliesTo: "all" | "category" | "products";
  category?: string | null;
  products?: string[];
  createdAt: string;
}

export interface ApplyCouponResponse {
  valid: boolean;
  code: string;
  type: "percent" | "flat";
  value: number;
  discountAmount: number;
  minOrderValue: number;
  message: string;
}

export async function applyCoupon(code: string, subtotal: number, items: any[] = []): Promise<ApplyCouponResponse> {
  return fetchApi("/coupons/apply", {
    method: "POST",
    body: JSON.stringify({ code, subtotal, items }),
  });
}

export async function getAllCoupons(): Promise<CouponItem[]> {
  return fetchApi("/coupons");
}

export async function createCoupon(data: {
  code: string;
  description?: string;
  type: "percent" | "flat";
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  expiresAt?: string;
  isActive?: boolean;
}): Promise<{ success: boolean; message: string; coupon: CouponItem }> {
  return fetchApi("/coupons", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCoupon(id: string, updates: Partial<CouponItem>): Promise<{ success: boolean; message: string; coupon: CouponItem }> {
  return fetchApi(`/coupons/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });
}

export async function deleteCoupon(id: string): Promise<{ success: boolean; message: string }> {
  return fetchApi(`/coupons/${id}`, {
    method: "DELETE",
  });
}
