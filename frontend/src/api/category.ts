import type { Category } from "@/data/catalog";
export type { Category };

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("token") || localStorage.getItem("userToken");
  return token ? { "Authorization": `Bearer ${token}` } : {};
}

/**
 * Public API: Fetch active categories for customers
 */
export async function getPublicCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/categories`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error("Failed to fetch categories");
    return await res.json();
  } catch (err) {
    console.error("Error fetching public categories:", err);
    return [];
  }
}

/**
 * Seller/Admin API: Fetch all categories (including inactive)
 */
export async function getSellerCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/seller/categories`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to fetch seller categories");
    return await res.json();
  } catch (err) {
    console.error("Error fetching seller categories:", err);
    return [];
  }
}

/**
 * Seller/Admin API: Create category with name, auto-generated slug, image, description
 */
export async function createCategory(data: Partial<Category>): Promise<Category> {
  const res = await fetch(`${API_BASE_URL}/seller/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    credentials: "include",
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to create category");
  return json.category;
}

/**
 * Seller/Admin API: Update existing category
 */
export async function updateCategory(id: string, data: Partial<Category>): Promise<Category> {
  const res = await fetch(`${API_BASE_URL}/seller/categories/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    credentials: "include",
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to update category");
  return json.category;
}

/**
 * Seller/Admin API: Delete category by ID
 */
export async function deleteCategory(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/seller/categories/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    credentials: "include",
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to delete category");
}
