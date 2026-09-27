import { fetchApi } from "@/lib/api";

export interface CustomOrderRequestData {
  name: string;
  email: string;
  phone?: string;
  type: string;
  budget?: string;
  deadline?: string;
  colors?: string;
  size?: string;
  details: string;
  referenceImage?: string;
}

export interface CustomOrder {
  _id: string;
  user: string;
  name: string;
  email: string;
  phone: string;
  type: string;
  budget: string;
  deadline: string;
  colors: string;
  size: string;
  details: string;
  referenceImage?: string;
  status: "requested" | "in_review" | "quoted" | "accepted" | "rejected" | "completed";
  quoteAmount?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export async function createCustomOrder(data: CustomOrderRequestData) {
  return fetchApi("/custom-orders", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMyCustomOrders(): Promise<CustomOrder[]> {
  return fetchApi("/custom-orders/my-orders");
}

export async function getAllCustomOrders(): Promise<CustomOrder[]> {
  return fetchApi("/custom-orders");
}

export async function updateCustomOrderStatus(
  id: string,
  payload: { status?: string; quoteAmount?: number; notes?: string }
) {
  return fetchApi(`/custom-orders/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
