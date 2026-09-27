export type CustomOrderUpdate = {
  id: string;
  date: string;
  note: string;
  photoUrl?: string; // We'll use URL string for simplicity since we don't have a backend to store files
};

export type CustomOrder = {
  id: string;
  createdAt: string;
  status: "requested" | "in-progress" | "progress-shared" | "completed";
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  requestDetails: {
    type: string;
    budget: string;
    deadline: string;
    colors: string;
    size: string;
    details: string;
    referenceImage?: string;
  };
  updates?: CustomOrderUpdate[];
};

const KEY = "ahc_custom_orders";

export function loadCustomOrders(): CustomOrder[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "[]") as CustomOrder[];
  } catch {
    return [];
  }
}

export function saveCustomOrder(order: CustomOrder) {
  const all = loadCustomOrders();
  all.unshift(order);
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export function newCustomOrderId() {
  return `CUST${Date.now().toString().slice(-6)}`;
}

export const customStatusLabel: Record<CustomOrder["status"], string> = {
  "requested": "Requested",
  "in-progress": "In Progress",
  "progress-shared": "Progress Shared",
  "completed": "Completed",
};
