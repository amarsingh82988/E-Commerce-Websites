import { useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { PageHeader, PageShell } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatINR } from "@/lib/format";
import { findOrder, statusLabel, statusSteps, type Order } from "@/store/orders";

export default function TrackOrderPage() {
  const [id, setId] = useState("");
  const [result, setResult] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    setResult(findOrder(id) ?? null);
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Where is it?"
        title="Track your order"
        intro="Your order number looks like AHC12345678 and is in your confirmation email."
      />

      <div className="container-page max-w-2xl py-16">
        <form onSubmit={search} className="rounded-3xl border border-border bg-card p-7 shadow-soft">
          <div className="space-y-2">
            <Label htmlFor="orderid">Order number</Label>
            <div className="flex gap-2">
              <Input id="orderid" value={id} onChange={(e) => setId(e.target.value)} placeholder="AHC12345678" />
              <Button type="submit">Track</Button>
            </div>
          </div>
        </form>

        {searched && !result && (
          <p className="mt-8 text-center text-sm text-muted-foreground">
            We couldn't find that order number. Double-check it, or{" "}
            <Link to="/contact" className="text-accent underline underline-offset-4">
              contact the studio
            </Link>
            .
          </p>
        )}

        {result && (
          <div className="mt-8 rounded-3xl border border-border bg-card p-7 shadow-soft">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-display text-2xl">{result.id}</p>
              <p className="text-sm text-muted-foreground">
                Placed {new Date(result.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
              </p>
            </div>

            <ol className="mt-8 space-y-4">
              {statusSteps.map((s, i) => {
                const done = statusSteps.indexOf(result.status) >= i;
                return (
                  <li key={s} className="flex items-center gap-3">
                    <span
                      className={`flex size-7 items-center justify-center rounded-full border ${
                        done ? "border-accent bg-accent text-accent-foreground" : "border-border text-muted-foreground"
                      }`}
                    >
                      {done ? <Check className="size-4" /> : <span className="text-xs">{i + 1}</span>}
                    </span>
                    <span className={done ? "text-foreground" : "text-muted-foreground"}>{statusLabel[s]}</span>
                  </li>
                );
              })}
            </ol>

            <div className="mt-8 border-t border-border pt-6">
              {result.items.map((it) => (
                <div key={`${it.productId}-${it.color}-${it.size}`} className="flex justify-between py-1.5 text-sm">
                  <span className="text-muted-foreground">
                    {it.title} × {it.qty}
                  </span>
                  <span>{formatINR(it.price * it.qty)}</span>
                </div>
              ))}
              <div className="mt-3 flex justify-between border-t border-border pt-3 font-medium">
                <span>Total</span>
                <span>{formatINR(result.total)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
