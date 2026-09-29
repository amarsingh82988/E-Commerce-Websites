import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, ShieldCheck, Loader2, LogIn } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, PageShell } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatINR } from "@/lib/format";
import { useShop } from "@/store/shop";
import { useAuth } from "@/context/AuthContext";
import { createOrder, verifyRazorpayPayment } from "@/api/orders";
import { getPublicSettings } from "@/api/content";
import { applyCoupon } from "@/api/coupons";
import { Tag, X } from "lucide-react";

/** Helper to dynamically load Razorpay Checkout Script */
function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      return resolve(true);
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const { cart, subtotal, clearCart, allProducts } = useShop();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [payment, setPayment] = useState<"razorpay" | "cod">("razorpay");
  const [placing, setPlacing] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);


  const [shippingConfig, setShippingConfig] = useState({ fee: 79, freeThreshold: 1499, codFee: 49, codEnabled: true });

  useEffect(() => {
    getPublicSettings().then(data => {
      if (data?.shipping) {
        setShippingConfig({
          fee: data.shipping.fee ?? 79,
          freeThreshold: data.shipping.freeThreshold ?? 1499,
          codFee: data.shipping.codFee ?? 49,
          codEnabled: data.shipping.codEnabled ?? true
        });
      }
    });
  }, []);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pin: "",
    notes: "",
  });

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) {
      toast.error("Please enter a coupon code.");
      return;
    }
    setValidatingCoupon(true);
    try {
      const res = await applyCoupon(couponInput.trim(), subtotal, cart);
      if (res.valid) {
        setAppliedCoupon({ code: res.code, discountAmount: res.discountAmount });
        toast.success(res.message || `Coupon "${res.code}" applied!`);
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid coupon code.");
    } finally {
      setValidatingCoupon(false);
    }
  };

  // Autofill user details when logged in
  useEffect(() => {
    if (user) {
      const defaultAddr = user.addresses?.find((a: any) => a.isDefault) || user.addresses?.[0];
      setForm((f) => ({
        ...f,
        name: f.name || user.name || "",
        email: f.email || user.email || "",
        phone: f.phone || user.phone || "",
        address: f.address || defaultAddr?.line1 || "",
        city: f.city || defaultAddr?.city || "",
        state: f.state || defaultAddr?.state || "",
        pin: f.pin || defaultAddr?.pincode || "",
      }));
    }
  }, [user]);

  // Preload Razorpay SDK script
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const discount = appliedCoupon?.discountAmount ?? 0;
  const shipping = subtotal >= shippingConfig.freeThreshold ? 0 : shippingConfig.fee;
  const codFee = payment === "cod" ? shippingConfig.codFee : 0;
  const total = Math.max(0, subtotal - discount) + shipping + codFee;

  if (cart.length === 0) {
    return (
      <PageShell>
        <PageHeader eyebrow="Checkout" title="Nothing to check out yet" intro="Your cart is empty." />
        <div className="container-page py-20 text-center">
          <Button asChild size="lg">
            <Link to="/shop">Shop the collection</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please log in to proceed with checkout.");
      return;
    }
    if (form.name.trim().length < 2) {
      toast.error("Please enter your full name");
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, "").slice(-10))) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    if (form.address.trim().length < 6) {
      toast.error("Please enter your full shipping address");
      return;
    }
    if (!/^\d{6}$/.test(form.pin)) {
      toast.error("Please enter a valid 6-digit PIN code");
      return;
    }

    setPlacing(true);

    try {
      // Send ONLY cart identifiers and address to backend (Backend calculates tamper-proof totals!)
      const payload = {
        items: cart.map((c) => ({
          productId: c.productId,
          qty: c.qty,
          color: c.color,
          size: c.size,
          note: c.note,
        })),
        shippingAddress: {
          fullName: form.name,
          phone: form.phone,
          line1: form.address,
          city: form.city,
          state: form.state,
          pincode: form.pin,
          email: form.email,
        },
        paymentMethod: payment,
        customerNote: form.notes,
        couponCode: appliedCoupon?.code,
      };

      const res = await createOrder(payload);

      // Handle Cash on Delivery (COD) Order
      if (payment === "cod") {
        clearCart();
        toast.success("Order placed successfully with Cash on Delivery!");
        navigate(`/order-confirmation?order=${encodeURIComponent(res.orderNumber)}`);
        return;
      }

      // Handle Razorpay Payment Gateway
      const isScriptLoaded = await loadRazorpayScript();
      if (!isScriptLoaded) {
        toast.error("Failed to load Razorpay payment SDK. Please check your internet connection.");
        setPlacing(false);
        return;
      }

      const options = {
        key: res.key || "rzp_test_placeholder",
        amount: res.amountPaise || Math.round(total * 100),
        currency: res.currency || "INR",
        name: "Apne Hath Crochet",
        description: `Order #${res.orderNumber}`,
        image: "/placeholder.jpg",
        order_id: res.razorpayOrderId,
        handler: async function (response: any) {
          try {
            const verifyRes = await verifyRazorpayPayment({
              orderId: res.orderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            clearCart();
            toast.success(verifyRes.message || "Payment verified & order confirmed!");
            navigate(`/order-confirmation?order=${encodeURIComponent(verifyRes.orderNumber || res.orderNumber)}`);
          } catch (verifyErr: any) {
            toast.error(verifyErr.message || "Payment verification failed.");
          } finally {
            setPlacing(false);
          }
        },
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone,
        },
        notes: {
          orderNumber: res.orderNumber,
        },
        theme: {
          color: "#d97706",
        },
        modal: {
          ondismiss: function () {
            setPlacing(false);
            toast.info("Payment popup closed.");
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (failRes: any) {
        setPlacing(false);
        toast.error(failRes.error?.description || "Payment process failed.");
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err.message || "Failed to place order.");
      setPlacing(false);
    }
  };

  return (
    <PageShell>
      <PageHeader eyebrow="Almost yours" title="Checkout" intro="Tell us where to send your handmade parcel." />

      <form onSubmit={placeOrder} className="container-page grid gap-10 py-14 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-8">
          {/* Authentication Check Banner */}
          {authLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !user ? (
            <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 dark:border-amber-900/60 dark:bg-amber-950/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <LogIn className="h-6 w-6 text-amber-600 dark:text-amber-300 shrink-0" />
                <div>
                  <p className="font-medium text-sm text-amber-900 dark:text-amber-200">
                    Logged in account required for checkout
                  </p>
                  <p className="text-xs text-amber-700/80 dark:text-amber-400">
                    Please log in to save your order to your account and track delivery updates.
                  </p>
                </div>
              </div>
              <Button asChild size="sm">
                <Link to="/login">Log in</Link>
              </Button>
            </div>
          ) : null}

          <section className="rounded-3xl border border-border bg-card p-7 shadow-soft">
            <h2 className="font-display text-2xl">Delivery details</h2>
            {user?.addresses && user.addresses.length > 0 && (
              <div className="mt-4">
                <Label className="text-muted-foreground mb-3 block">Saved Addresses</Label>
                <div className="flex flex-col gap-3">
                  {user.addresses.map((addr: any, i: number) => (
                    <div 
                      key={i} 
                      onClick={() => setForm(f => ({
                        ...f,
                        name: addr.fullName || user.name || "",
                        phone: addr.phone || user.phone || "",
                        address: addr.line1 || "",
                        city: addr.city || "",
                        state: addr.state || "",
                        pin: addr.pincode || ""
                      }))}
                      className="cursor-pointer rounded-xl border border-border p-3 transition-colors hover:border-primary/50 hover:bg-secondary/40 flex items-start gap-3"
                    >
                      <input 
                        type="radio" 
                        name="saved-address" 
                        className="mt-1"
                        checked={form.address === addr.line1 && form.pin === addr.pincode}
                        readOnly
                      />
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground block">{addr.fullName || user.name}</span>
                        {addr.line1}, {addr.city}, {addr.state} {addr.pincode}
                      </div>
                    </div>
                  ))}
                  <div 
                    onClick={() => setForm(f => ({ ...f, address: "", city: "", state: "", pin: "" }))}
                    className="cursor-pointer rounded-xl border border-dashed border-border p-3 transition-colors hover:border-primary/50 text-sm text-center text-primary font-medium"
                  >
                    + Use a different address
                  </div>
                </div>
                <div className="my-6 border-t border-border"></div>
              </div>
            )}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="fname">Full name *</Label>
                <Input id="fname" value={form.name} onChange={set("name")} placeholder="Aditi Sharma" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="femail">Email *</Label>
                <Input id="femail" type="email" value={form.email} onChange={set("email")} placeholder="you@email.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fphone">Mobile number *</Label>
                <Input id="fphone" value={form.phone} onChange={set("phone")} placeholder="9876543210" required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="faddr">Address (House No, Street, Landmark) *</Label>
                <Textarea id="faddr" rows={3} value={form.address} onChange={set("address")} placeholder="Flat 101, Green Acres, MG Road" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fcity">City *</Label>
                <Input id="fcity" value={form.city} onChange={set("city")} placeholder="Lucknow" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fstate">State *</Label>
                <Input id="fstate" value={form.state} onChange={set("state")} placeholder="Uttar Pradesh" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fpin">PIN code *</Label>
                <Input id="fpin" value={form.pin} onChange={set("pin")} placeholder="226001" maxLength={6} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="fnotes">Order notes (optional)</Label>
                <Textarea id="fnotes" rows={2} value={form.notes} onChange={set("notes")} placeholder="Gift wrap, a message to add…" />
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-7 shadow-soft">
            <h2 className="font-display text-2xl">Payment method</h2>
            <RadioGroup
              value={payment}
              onValueChange={(v) => setPayment(v as "razorpay" | "cod")}
              className="mt-6 space-y-3"
            >
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-4 transition-colors hover:bg-secondary/40">
                <RadioGroupItem value="razorpay" id="pay-prepaid" className="mt-1" />
                <span>
                  <span className="block font-medium">Razorpay (UPI, Cards, NetBanking, Wallets)</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">
                    Fast &amp; 100% secure payment via Razorpay. Free shipping over ₹{shippingConfig.freeThreshold}.
                  </span>
                </span>
              </label>
              {shippingConfig.codEnabled && (
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border p-4 transition-colors hover:bg-secondary/40">
                  <RadioGroupItem value="cod" id="pay-cod" className="mt-1" />
                  <span>
                    <span className="block font-medium">Cash on Delivery (COD)</span>
                    <span className="block text-xs text-muted-foreground mt-0.5">
                      Pay in cash upon doorstep delivery. Additional ₹{shippingConfig.codFee} COD fee.
                    </span>
                  </span>
                </label>
              )}
            </RadioGroup>
            <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 text-accent" /> Server-verified tamper-proof pricing &amp; 256-bit encryption.
            </p>
          </section>
        </div>

        <aside className="h-fit rounded-3xl border border-border bg-card p-7 shadow-soft lg:sticky lg:top-24">
          <h2 className="font-display text-2xl">Order summary</h2>
          <div className="mt-6 space-y-4">
            {cart.map((line) => {
              const p = allProducts.find((x) => x.id === line.productId || x.slug === line.productId);
              return (
                <div key={`${line.productId}-${line.color}-${line.size}`} className="flex gap-3">
                  <img
                    src={p?.images?.[0] || "/placeholder.jpg"}
                    alt={p?.name || "Item"}
                    className="size-16 rounded-xl object-cover bg-secondary"
                    loading="lazy"
                  />
                  <div className="flex-1 text-sm">
                    <p className="font-medium">{p?.name || "Handmade item"}</p>
                    <p className="text-muted-foreground text-xs">
                      Qty {line.qty}
                      {line.color ? ` · ${line.color}` : ""}
                      {line.size ? ` · ${line.size}` : ""}
                    </p>
                  </div>
                  <p className="text-sm font-medium">{formatINR((p?.price || 0) * line.qty)}</p>
                </div>
              );
            })}
          </div>

          {/* Promo Code Input */}
          <div className="mt-6 border-t border-border pt-4 space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-accent" /> Promo Code
            </label>
            {appliedCoupon ? (
              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/70 p-2.5 text-xs text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30">
                <div>
                  <span className="font-semibold">{appliedCoupon.code}</span>
                  <span className="ml-2 text-emerald-700 font-normal">(-{formatINR(discount)})</span>
                </div>
                <button type="button" onClick={() => setAppliedCoupon(null)} className="text-emerald-700 hover:text-emerald-900">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Coupon code"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  className="text-xs h-9"
                />
                <Button type="button" variant="secondary" size="sm" disabled={validatingCoupon} onClick={handleApplyCoupon}>
                  {validatingCoupon ? "Checking…" : "Apply"}
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
            <Row label="Subtotal" value={formatINR(subtotal)} />
            {appliedCoupon && <Row label={`Discount (${appliedCoupon.code})`} value={`−${formatINR(discount)}`} />}
            <Row label="Shipping" value={shipping === 0 ? "Free" : formatINR(shipping)} />
            {codFee > 0 && <Row label="COD handling" value={formatINR(codFee)} />}
            <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
              <span>Total</span>
              <span>{formatINR(total)}</span>
            </div>
          </div>

          <Button type="submit" size="lg" className="mt-6 w-full" disabled={placing || !user}>
            {placing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing…
              </>
            ) : (
              <>
                <Lock className="mr-2 size-4" />
                {payment === "razorpay" ? `Pay with Razorpay · ${formatINR(total)}` : `Place COD Order · ${formatINR(total)}`}
              </>
            )}
          </Button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            By placing an order you agree to our{" "}
            <Link to="/terms" className="underline underline-offset-4">
              terms
            </Link>{" "}
            &amp;{" "}
            <Link to="/privacy-policy" className="underline underline-offset-4">
              privacy policy
            </Link>
            .
          </p>
        </aside>
      </form>
    </PageShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
