import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { type Product } from "@/data/catalog";
import { fetchApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export type CartLine = {
  productId: string;
  qty: number;
  color?: string;
  size?: string;
  note?: string;
};

type ShopState = {
  cart: CartLine[];
  wishlist: string[];
  ready: boolean;
  addToCart: (line: CartLine) => void;
  updateQty: (index: number, qty: number) => void;
  removeLine: (index: number) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  inWishlist: (productId: string) => boolean;
  cartCount: number;
  subtotal: number;
  allProducts: Product[];
};

const ShopContext = createContext<ShopState | null>(null);

const CART_KEY = "ahc.cart";
const WISH_KEY = "ahc.wishlist";

type ApiProduct = {
  _id?: string;
  id?: string;
  slug?: string;
  title?: string;
  name?: string;
  shortDescription?: string;
  subtitle?: string;
  description?: string;
  price: number;
  compareAtPrice?: number;
  rating?: number;
  reviewsCount?: number;
  stock?: number;
  badge?: string;
  tags?: string[];
  images?: string[];
  category?: { name?: string } | string;
  artisanName?: string;
  artisanLocation?: string;
  specifications?: string[];
  features?: string[];
  materials?: string[];
  dimensions?: string;
  leadTimeDays?: number;
  customizable?: boolean;
  
  isActive?: boolean;
};

type ApiCartItem = {
  productId?: string;
  product?: string | { _id?: string };
  id?: string;
  qty?: number;
  quantity?: number;
  color?: string;
  size?: string;
  note?: string;
};

type ApiWishlistItem = string | { _id?: string; id?: string; productId?: string };

export function ShopProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartLine[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem(CART_KEY);
      return stored ? (JSON.parse(stored) as CartLine[]) : [];
    } catch {
      return [];
    }
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = window.localStorage.getItem(WISH_KEY);
      return stored ? (JSON.parse(stored) as string[]) : [];
    } catch {
      return [];
    }
  });
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [ready] = useState(true);

  // 1. Initial local state hydration & dynamic product fetching
  useEffect(() => {
    fetchApi("/products?limit=100")
      .then((res) => {
        if (res?.products && Array.isArray(res.products)) {
          const mapped: Product[] = res.products.map((p: ApiProduct) => ({
            id: p._id || p.id,
            slug: p.slug,
            name: p.title || p.name,
            subtitle: p.shortDescription || p.subtitle || "",
            description: p.description || "",
            price: p.price,
            originalPrice: p.compareAtPrice || p.price,
            rating: p.rating || 4.5,
            reviewsCount: p.reviewsCount || 10,
            stock: p.stock ?? 50,
            badge: p.badge,
            tags: p.tags || [],
            images: Array.isArray(p.images) && p.images.length > 0 ? p.images : ["/placeholder.jpg"],
            category:
              typeof p.category === "object"
                ? p.category?.name || "Uncategorized"
                : p.category || "Uncategorized",
            artisan: { name: p.artisanName || "Handicraft Artisan", city: p.artisanLocation || "India" },
            specifications: p.specifications || [],
            bulletPoints: p.features || [],
            materials: p.materials || [],
            dimensions: p.dimensions || "",
            leadTimeDays: p.leadTimeDays || 3,
            customizable: p.customizable || false,
            isActive: p.isActive !== false,
          }));
          setDbProducts(mapped);
        }
      })
      .catch(() => {});
  }, []);

  // 2. Seamless Guest-to-User Cart & Wishlist Sync & Merge when User logs in
  useEffect(() => {
    if (!ready || !user) return;

    // Sync & Merge Cart
    fetchApi("/user/cart")
      .then((dbCart) => {
        if (Array.isArray(dbCart)) {
          const normalizedDb: CartLine[] = dbCart
            .map((item: ApiCartItem) => ({
              productId: String(item.productId || (typeof item.product === "object" ? item.product?._id : item.product) || item.id || ""),
              qty: item.qty || item.quantity || 1,
              color: item.color,
              size: item.size,
              note: item.note,
            }))
            .filter((i) => i.productId);

          setCart((localCart) => {
            const merged: CartLine[] = [...normalizedDb];
            for (const guestLine of localCart) {
              const idx = merged.findIndex(
                (m) => m.productId === guestLine.productId && m.color === guestLine.color && m.size === guestLine.size
              );
              if (idx === -1) {
                merged.push(guestLine);
              } else {
                merged[idx] = {
                  ...merged[idx]!,
                  qty: Math.max((merged[idx]?.qty || 0), guestLine.qty),
                };
              }
            }
            localStorage.setItem(CART_KEY, JSON.stringify(merged));
            fetchApi("/user/cart", { method: "PUT", body: JSON.stringify({ cart: merged }) }).catch(() => {});
            return merged;
          });
        }
      })
      .catch(() => {});

    // Sync & Merge Wishlist
    fetchApi("/user/wishlist")
      .then((dbWish) => {
        if (Array.isArray(dbWish)) {
          const normalizedWish: string[] = dbWish
            .map((item: ApiWishlistItem) => (typeof item === "string" ? item : item._id || item.id || item.productId))
            .filter((id): id is string => Boolean(id));

          setWishlist((localWish) => {
            const merged = Array.from(new Set([...normalizedWish, ...localWish]));
            localStorage.setItem(WISH_KEY, JSON.stringify(merged));
            fetchApi("/user/wishlist", { method: "PUT", body: JSON.stringify({ wishlist: merged }) }).catch(() => {});
            return merged;
          });
        }
      })
      .catch(() => {});
  }, [ready, user]);

  // 3. Persist local changes to localStorage & backend
  useEffect(() => {
    if (ready) {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      if (user) {
        fetchApi("/user/cart", { method: "PUT", body: JSON.stringify({ cart }) }).catch(() => {});
      }
    }
  }, [cart, ready, user]);

  useEffect(() => {
    if (ready) {
      localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
      if (user) {
        fetchApi("/user/wishlist", { method: "PUT", body: JSON.stringify({ wishlist }) }).catch(() => {});
      }
    }
  }, [wishlist, ready, user]);

  const allProducts = useMemo(() => {
    return [...dbProducts];
  }, [dbProducts]);

  const value = useMemo<ShopState>(() => {
    const subtotal = cart.reduce((sum, line) => {
      const p = allProducts.find((x) => x.id === line.productId || x.slug === line.productId);
      return sum + (p ? p.price * line.qty : 0);
    }, 0);

    return {
      cart,
      wishlist,
      ready,
      allProducts,
      cartCount: cart.reduce((n, l) => n + l.qty, 0),
      subtotal,
      addToCart: (line) =>
        setCart((prev) => {
          const product = allProducts.find((p) => p.id === line.productId || p.slug === line.productId);
          const name = product?.name || "Item";
          toast.success(`Added ${line.qty} x ${name} to your cart`);

          const i = prev.findIndex(
            (l) => l.productId === line.productId && l.color === line.color && l.size === line.size,
          );
          if (i === -1) return [...prev, line];
          const next = [...prev];
          const existing = next[i]!;
          const max = product?.stock ?? 99;
          next[i] = { ...existing, qty: Math.min(existing.qty + line.qty, max) };
          return next;
        }),
      updateQty: (index, qty) =>
        setCart((prev) =>
          prev.map((l, i) => (i === index ? { ...l, qty: Math.max(1, qty) } : l)),
        ),
      removeLine: (index) =>
        setCart((prev) => {
          const removed = prev[index];
          if (removed) {
            const product = allProducts.find((p) => p.id === removed.productId || p.slug === removed.productId);
            toast.info(`Removed ${product?.name || "Item"} from cart`);
          }
          return prev.filter((_, i) => i !== index);
        }),
      clearCart: () => setCart([]),
      toggleWishlist: (productId) =>
        setWishlist((prev) => {
          const product = allProducts.find((p) => p.id === productId || p.slug === productId);
          const isAdded = !prev.includes(productId);
          if (isAdded) {
            toast.success(`Added ${product?.name || "Item"} to wishlist`);
          } else {
            toast.info(`Removed ${product?.name || "Item"} from wishlist`);
          }
          return isAdded ? [...prev, productId] : prev.filter((id) => id !== productId);
        }),
      inWishlist: (productId) => wishlist.includes(productId),
    };
  }, [cart, wishlist, ready, allProducts]);

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside ShopProvider");
  return ctx;
}
