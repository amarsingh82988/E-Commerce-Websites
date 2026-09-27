import type { Product } from "@/data/catalog";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("token") || localStorage.getItem("userToken");
  return token ? { "Authorization": `Bearer ${token}` } : {};
}

export type ProductFilterParams = {
  category?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  badge?: "featured" | "bestseller" | "newArrival";
  sort?: "price-asc" | "price-desc" | "newest" | "rating";
  page?: number;
  limit?: number;
};

export type ProductListResponse = {
  products: Product[];
  total: number;
  page: number;
  pages: number;
};

/**
 * Public API: Fetch product catalog with filtering, search, and pagination
 */
export async function getPublicProducts(params: ProductFilterParams = {}): Promise<ProductListResponse> {
  try {
    const query = new URLSearchParams();
    if (params.category) query.append("category", params.category);
    if (params.search) query.append("search", params.search);
    if (params.minPrice !== undefined) query.append("minPrice", String(params.minPrice));
    if (params.maxPrice !== undefined) query.append("maxPrice", String(params.maxPrice));
    if (params.badge) query.append("badge", params.badge);
    if (params.sort) query.append("sort", params.sort);
    if (params.page) query.append("page", String(params.page));
    if (params.limit) query.append("limit", String(params.limit));

    const res = await fetch(`${API_BASE_URL}/products?${query.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    });

    if (!res.ok) throw new Error("Failed to fetch products");
    const data = await res.json();
    return {
      products: (data.products || []).map(normalizeProduct),
      total: data.total || 0,
      page: data.page || 1,
      pages: data.pages || 1,
    };
  } catch (err) {
    console.error("Error fetching public products:", err);
    return { products: [], total: 0, page: 1, pages: 1 };
  }
}

/**
 * Public API: Fetch product details by slug
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/products/${slug}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    });

    if (!res.ok) return null;
    const data = await res.json();
    return normalizeProduct(data);
  } catch (err) {
    console.error("Error fetching product by slug:", err);
    return null;
  }
}

/**
 * Seller API: Fetch all products for seller dashboard
 */
export async function getSellerProducts(): Promise<ProductListResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/seller/products`, {
      method: "GET",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      credentials: "include",
    });

    if (!res.ok) throw new Error("Failed to fetch seller products");
    const data = await res.json();
    return {
      products: (data.products || []).map(normalizeProduct),
      total: data.total || 0,
      page: data.page || 1,
      pages: data.pages || 1,
    };
  } catch (err) {
    console.error("Error fetching seller products:", err);
    return { products: [], total: 0, page: 1, pages: 1 };
  }
}

/**
 * Seller API: Create new product
 */
export async function createProduct(data: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/seller/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    credentials: "include",
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to create product");
  return normalizeProduct(json.product);
}

/**
 * Seller API: Update product
 */
export async function updateProduct(id: string, data: Partial<Product>): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/seller/products/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    credentials: "include",
    body: JSON.stringify(data),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to update product");
  return normalizeProduct(json.product);
}

/**
 * Seller API: Delete product (soft delete)
 */
export async function deleteProduct(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/seller/products/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    credentials: "include",
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to delete product");
}

/**
 * Seller API: Toggle badges
 */
export async function toggleProductBadges(id: string, badges: { featured?: boolean; bestseller?: boolean; newArrival?: boolean }): Promise<Product> {
  const res = await fetch(`${API_BASE_URL}/seller/products/${id}/badges`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...getAuthHeaders() },
    credentials: "include",
    body: JSON.stringify(badges),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Failed to update badges");
  return normalizeProduct(json.product);
}

/**
 * Normalize backend product document to frontend Product model
 */
function normalizeProduct(raw: any): Product {
  const categorySlug = typeof raw.category === "object" && raw.category !== null ? raw.category.slug : raw.category;
  const images = Array.isArray(raw.images) && raw.images.length > 0 ? raw.images : raw.featuredImage ? [raw.featuredImage] : [];

  return {
    id: String(raw._id || raw.id || ""),
    slug: raw.slug || "",
    name: raw.name || "",
    shortDescription: raw.shortDescription || "",
    description: raw.description || "",
    price: Number(raw.price) || 0,
    compareAtPrice: raw.compareAtPrice ? Number(raw.compareAtPrice) : undefined,
    category: categorySlug || "uncategorized",
    sku: raw.sku || "",
    stock: Number(raw.stock) || 0,
    images: images,
    featuredImage: raw.featuredImage || images[0] || "",
    colors: Array.isArray(raw.colors) ? raw.colors : [],
    sizes: Array.isArray(raw.sizes) ? raw.sizes : [],
    materials: raw.materials || "",
    careInstructions: raw.careInstructions || "",
    estimatedDelivery: raw.estimatedDelivery || "7-10 days",
    customizable: Boolean(raw.customizable),
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    featured: Boolean(raw.featured),
    bestseller: Boolean(raw.bestseller),
    newArrival: Boolean(raw.newArrival),
    rating: typeof raw.rating === "number" ? raw.rating : 4.8,
    reviewCount: typeof raw.reviewCount === "number" ? raw.reviewCount : 0,
    isActive: typeof raw.isActive === "boolean" ? raw.isActive : true,
    isDeleted: Boolean(raw.isDeleted),
    deletedAt: raw.deletedAt || null,
    deletedBy: raw.deletedBy || null,
    seoTitle: raw.seoTitle || "",
    seoDescription: raw.seoDescription || "",
    createdAt: raw.createdAt || new Date().toISOString(),
    updatedAt: raw.updatedAt || "",
  };
}
