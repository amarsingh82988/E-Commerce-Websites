import { fetchApi } from "@/lib/api";

export interface ShippingAddressInput {
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  email?: string;
}

export interface CreateOrderPayload {
  items: Array<{
    productId: string;
    qty: number;
    color?: string;
    size?: string;
    note?: string;
  }>;
  shippingAddress: ShippingAddressInput;
  paymentMethod: "razorpay" | "cod";
  customerNote?: string;
}

export interface CreateOrderResponse {
  success: boolean;
  orderId: string;
  orderNumber: string;
  paymentMethod: "razorpay" | "cod";
  status: string;
  razorpayOrderId?: string;
  amount?: number;
  amountPaise?: number;
  currency?: string;
  key?: string;
  message?: string;
}

export interface VerifyPaymentPayload {
  orderId?: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface OrderItem {
  product: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  quantity: number;
  color?: string;
  size?: string;
  note?: string;
}

export interface OrderDetails {
  _id: string;
  orderNumber: string;
  user: string;
  email: string;
  items: OrderItem[];
  shippingAddress: ShippingAddressInput;
  subtotal: number;
  discount: number;
  shippingFee: number;
  codFee: number;
  total: number;
  coupon?: { code: string; discount: number };
  paymentMethod: "razorpay" | "cod";
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  razorpay?: { orderId?: string; paymentId?: string; signature?: string };
  status: "pending" | "confirmed" | "in_production" | "shipped" | "delivered" | "cancelled";
  timeline?: Array<{ status: string; note?: string; at: string }>;
  trackingNumber?: string;
  courier?: string;
  customerNote?: string;
  createdAt: string;
  updatedAt: string;
}

export async function createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
  return fetchApi("/orders/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function verifyRazorpayPayment(payload: VerifyPaymentPayload): Promise<{
  success: boolean;
  message: string;
  orderNumber: string;
  order?: OrderDetails;
}> {
  return fetchApi("/orders/verify-payment", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMyOrders(): Promise<OrderDetails[]> {
  return fetchApi("/orders/my-orders");
}

export async function getOrderDetails(identifier: string): Promise<OrderDetails> {
  return fetchApi(`/orders/${identifier}`);
}

/**
 * Seller API: Fetch all orders
 */
export async function getSellerOrders(): Promise<OrderDetails[]> {
  return fetchApi("/seller/orders");
}

/**
 * Seller API: Update order status
 */
export async function updateSellerOrderStatus(
  id: string, 
  status: string,
  note?: string,
  trackingNumber?: string,
  courier?: string
): Promise<void> {
  return fetchApi(`/seller/orders/${id}/status`, {
    method: "PUT",
    body: JSON.stringify({ status, note, trackingNumber, courier }),
  });
}

