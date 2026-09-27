import type { SiteContent } from "@/store/content";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

/**
 * Public API: Fetch site content (Hero, About/Story, FAQs, Policies) from backend DB
 */
export async function getSiteContent(): Promise<SiteContent | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/content`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) throw new Error("Failed to fetch site content");
    return await res.json();
  } catch (err) {
    console.error("Error fetching site content from backend:", err);
    return null;
  }
}

/**
 * Admin API: Update site content in backend DB
 */
export async function updateSiteContent(content: SiteContent): Promise<SiteContent> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  const token = localStorage.getItem("token") || localStorage.getItem("seller_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}/content`, {
    method: "PUT",
    headers,
    credentials: "include",
    body: JSON.stringify(content),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Failed to update site content");
  }

  return json.content;
}
