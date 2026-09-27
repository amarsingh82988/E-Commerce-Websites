import { useState } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ShieldCheck, Truck, Sparkles, Tag, X, Heart } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageShell } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/lib/format";
import { useShop } from "@/store/shop";
import { ProductCard } from "@/components/site/ProductCard";

import { applyCoupon } from "@/api/coupons";

const FREE_SHIPPING_THRESHOLD = 1499;

export default function CartPage() {
  const { cart, updateQty, removeLine, clearCart, subtotal, allProducts } = useShop();
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState<{ code: string; amount: number } | null>(null);
  const [applying, setApplying] = useState(false);

  const discount = applied?.amount ?? 0;
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 79;
  const total = Math.max(0, subtotal - discount) + shipping;

  const freeShippingProgress = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const amountForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  const applyCouponCode = async (couponKey: string) => {
    if (!couponKey.trim()) {
      toast.error("Please enter a coupon code.");
      return;
    }
    const cleanKey = couponKey.trim().toUpperCase();
    setApplying(true);
    try {
      const res = await applyCoupon(cleanKey, subtotal);
      if (res.valid) {
        setApplied({ code: res.code, amount: res.discountAmount });
        setCode(res.code);
        toast.success(res.message || `Coupon "${res.code}" applied!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid coupon code.");
    } finally {
      setApplying(false);
    }
  };

  const removeCoupon = () => {
    setApplied(null);
    setCode("");
    toast.info("Coupon removed.");
  };

  if (cart.length === 0) {
    const featuredItems = allProducts.slice(0, 3);

    return (
      <PageShell>
        <PageHeader eyebrow="Your cart" title="Your cart is empty" intro="Little things, made by hand — go find yours." />
        <div className="container-page py-16 text-center space-y-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary border border-border">
            <ShoppingBag className="h-9 w-9 text-muted-foreground" />
          </div>

          <div className="max-w-md mx-auto space-y-3">
            <h2 className="font-display text-2xl">Start adding handcrafted magic</h2>
            <p className="text-sm text-muted-foreground">
              Explore our artisan crochet bouquets, keychains, bags, and home decor items.
            </p>
            <Button asChild size="lg" className="mt-4">
              <Link to="/shop">
                Browse Shop Collection <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {featuredItems.length > 0 && (
            <div className="pt-12 border-t border-border max-w-5xl mx-auto text-left">
              <h3 className="font-display text-2xl mb-6 text-center">Trending Handicraft Recommendations</h3>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featuredItems.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader eyebrow="Your selection" title="Shopping Cart" />

      <div className="container-page py-10 space-y-8">
        {/* Free Shipping Progress Indicator */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between text-xs font-medium mb-2">
            <span className="flex items-center gap-1.5 text-foreground">
              <Truck className="h-4 w-4 text-accent" />
              {amountForFreeShipping > 0 ? (
                <>Add <span className="font-semibold text-accent">{formatINR(amountForFreeShipping)}</span> more for FREE Shipping!</>
              ) : (
                <span className="text-emerald-600 font-semibold flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> You've unlocked FREE Shipping!
                </span>
              )}
            </span>
            <span className="text-muted-foreground">{freeShippingProgress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-accent transition-all duration-500 ease-out"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          {/* Cart Items List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/70 pb-3 text-sm">
              <span className="font-medium text-muted-foreground">Items ({cart.reduce((n, l) => n + l.qty, 0)})</span>
              <button
                onClick={clearCart}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
              >
                <Trash2 className="h-3.5 w-3.5" /> Clear Cart
              </button>
            </div>

            {cart.map((line, i) => {
              const p = allProducts.find((x) => x.id === line.productId || x.slug === line.productId);
              const fallbackImage = p?.images?.[0] || p?.featuredImage || "/placeholder.jpg";
              const productName = p?.name || "Handcrafted Crochet Item";
              const unitPrice = p?.price || 0;
              const maxStock = p?.stock ?? 99;

              return (
                <div key={`${line.productId}-${i}`} className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm hover:border-border/80 transition-colors">
                  <Link to={p ? `/product/${p.slug}` : "/shop"} className="size-24 shrink-0 overflow-hidden rounded-xl bg-secondary border">
                    <img src={fallbackImage} alt={productName} loading="lazy" className="size-full object-cover" />
                  </Link>

                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link to={p ? `/product/${p.slug}` : "/shop"} className="font-display text-lg leading-tight hover:text-accent transition-colors">
                          {productName}
                        </Link>
                        <p className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-2">
                          {[line.color && `Color: ${line.color}`, line.size && `Size: ${line.size}`].filter(Boolean).join(" · ")}
                        </p>
                        {line.note && <p className="mt-1 text-xs text-muted-foreground italic bg-muted/40 p-1.5 rounded-md">"{line.note}"</p>}
                      </div>

                      <button
                        aria-label="Remove item"
                        onClick={() => {
                          removeLine(i);
                          toast.info("Item removed from cart");
                        }}
                        className="text-muted-foreground hover:text-destructive p-1 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center rounded-full border border-border bg-background">
                        <button
                          aria-label="Decrease quantity"
                          className="p-2 disabled:opacity-40 hover:bg-secondary rounded-l-full transition-colors"
                          disabled={line.qty <= 1}
                          onClick={() => updateQty(i, line.qty - 1)}
                        >
                          <Minus className="size-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{line.qty}</span>
                        <button
                          aria-label="Increase quantity"
                          className="p-2 disabled:opacity-40 hover:bg-secondary rounded-r-full transition-colors"
                          disabled={line.qty >= maxStock}
                          onClick={() => {
                            if (line.qty >= maxStock) {
                              toast.error(`Only ${maxStock} items available in stock`);
                              return;
                            }
                            updateQty(i, line.qty + 1);
                          }}
                        >
                          <Plus className="size-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="font-semibold text-base">{formatINR(unitPrice * line.qty)}</span>
                        {line.qty > 1 && (
                          <p className="text-[0.7rem] text-muted-foreground">{formatINR(unitPrice)} each</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Sidebar: Coupon & Order Summary */}
          <aside className="space-y-6">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-6">
              <h2 className="font-display text-2xl border-b border-border/70 pb-4">Order Summary</h2>

              {/* Coupon Code Input */}
              <div className="space-y-3">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-accent" /> Promo Code
                </label>

                {applied ? (
                  <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                    <div>
                      <span className="font-semibold text-sm text-emerald-900 dark:text-emerald-200">{applied.code}</span>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">Save {formatINR(applied.amount)} on this order</p>
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-700 hover:text-emerald-900" onClick={removeCoupon}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      placeholder="e.g. HANDMADE10"
                      className="text-sm"
                    />
                    <Button variant="secondary" disabled={applying} onClick={() => applyCouponCode(code)}>
                      {applying ? "Checking…" : "Apply"}
                    </Button>
                  </div>
                )}
              </div>

              {/* Price Calculations */}
              <dl className="space-y-3 text-sm border-t border-border/70 pt-4">
                <div className="flex justify-between text-muted-foreground">
                  <dt>Subtotal</dt>
                  <dd className="font-medium text-foreground">{formatINR(subtotal)}</dd>
                </div>

                {applied && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <dt>Discount ({applied.code})</dt>
                    <dd>−{formatINR(discount)}</dd>
                  </div>
                )}

                <div className="flex justify-between text-muted-foreground">
                  <dt>Shipping</dt>
                  <dd className="font-medium text-foreground">
                    {shipping === 0 ? <span className="text-emerald-600 font-semibold">FREE</span> : formatINR(shipping)}
                  </dd>
                </div>

                <div className="border-t border-border/70 pt-3 flex justify-between text-base font-semibold text-foreground">
                  <dt>Total Amount</dt>
                  <dd className="text-xl text-accent">{formatINR(total)}</dd>
                </div>
              </dl>

              <Button asChild size="lg" className="w-full text-base font-medium py-6">
                <Link to="/checkout">
                  Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="rounded-2xl border border-border/80 bg-muted/30 p-5 space-y-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="h-5 w-5 text-accent shrink-0" />
                <span>100% Secure Checkout via Razorpay &amp; UPI</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Heart className="h-5 w-5 text-accent shrink-0" />
                <span>Handcrafted with patience &amp; premium yarn</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Truck className="h-5 w-5 text-accent shrink-0" />
                <span>Free Express Delivery on orders over ₹1,499</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}
