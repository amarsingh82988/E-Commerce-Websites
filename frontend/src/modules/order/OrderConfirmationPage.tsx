import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";
import { getOrderDetails, type OrderDetails } from "@/api/orders";


export default function OrderConfirmationPage() {
  const [params] = useSearchParams();
  const orderId = params.get("order") ?? "";
  const [dbOrder, setDbOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (orderId) {
      setLoading(true);
      getOrderDetails(orderId)
        .then((data) => {
          if (data) setDbOrder(data);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [orderId]);



  return (
    <PageShell>
      <div className="container-page max-w-2xl py-20 text-center">
        <CheckCircle2 className="mx-auto size-16 text-emerald-600" />
        <h1 className="mt-6 font-display text-4xl">Thank you for your order ♡</h1>
        <p className="mt-3 text-muted-foreground">
          Your order has been successfully placed. We've emailed the receipt and will keep you updated.
        </p>

        {orderId && (
          <p className="mt-6 inline-block rounded-full border border-border bg-secondary/60 px-5 py-2 text-sm font-medium">
            Order Number: <span className="font-mono text-accent">{orderId}</span>
          </p>
        )}

        {loading ? (
          <div className="mt-10 py-8 flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : dbOrder ? (
          <div className="mt-10 rounded-3xl border border-border bg-card p-7 text-left shadow-soft">
            <div className="flex items-center justify-between border-b border-border/70 pb-4 mb-4">
              <h2 className="font-display text-xl">Order Summary</h2>
              <span className="text-xs uppercase font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                {dbOrder.status}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              {dbOrder.items.map((it, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <div>
                    <p className="font-medium text-foreground">{it.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Qty {it.quantity} {it.color ? `· ${it.color}` : ""} {it.size ? `· ${it.size}` : ""}
                    </p>
                  </div>
                  <span className="font-medium">{formatINR(it.price * it.quantity)}</span>
                </div>
              ))}

              <div className="border-t border-border/70 pt-3 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatINR(dbOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{dbOrder.shippingFee === 0 ? "Free" : formatINR(dbOrder.shippingFee)}</span>
                </div>
                {dbOrder.codFee > 0 && (
                  <div className="flex justify-between">
                    <span>COD Fee</span>
                    <span>{formatINR(dbOrder.codFee)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border/70 pt-3 text-base font-semibold text-foreground">
                  <span>Total Paid ({dbOrder.paymentMethod.toUpperCase()})</span>
                  <span>{formatINR(dbOrder.total)}</span>
                </div>
              </div>
            </div>

            {dbOrder.shippingAddress && (
              <p className="mt-5 text-xs text-muted-foreground border-t border-border/70 pt-4">
                <span className="font-semibold text-foreground">Delivery to:</span> {dbOrder.shippingAddress.fullName},{" "}
                {dbOrder.shippingAddress.line1}, {dbOrder.shippingAddress.city}, {dbOrder.shippingAddress.state} - {dbOrder.shippingAddress.pincode}
              </p>
            )}
          </div>
        ) : null}

        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/shop">Keep shopping</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <Link to="/profile">View my orders</Link>
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
