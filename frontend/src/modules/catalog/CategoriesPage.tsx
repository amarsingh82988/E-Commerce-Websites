import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PageHeader, PageShell } from "@/components/site/Layout";
import { getPublicCategories, type Category } from "@/api/category";
import { getPublicProducts } from "@/api/product";
import { Skeleton } from "@/components/ui/skeleton";

export default function Categories() {
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPublicCategories(), getPublicProducts({ limit: 100 })])
      .then(([cats, prodRes]) => {
        if (cats) setCategoryList(cats);
        if (prodRes && prodRes.products) {
          const counts: Record<string, number> = {};
          prodRes.products.forEach((p) => {
            const catKey = typeof p.category === "object" && p.category ? (p.category as any).slug : String(p.category || "");
            if (catKey) {
              counts[catKey] = (counts[catKey] || 0) + 1;
            }
          });
          setProductCounts(counts);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageShell>
      <PageHeader eyebrow="Browse" title="Categories" intro="Every collection, made by hand in small batches." />
      
      {loading ? (
        <div className="container-page grid gap-6 py-14 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl border border-border p-6">
              <Skeleton className="h-full w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : categoryList.length === 0 ? (
        <div className="container-page py-16 text-center text-muted-foreground">
          No categories available at the moment.
        </div>
      ) : (
        <div className="container-page grid gap-6 py-14 sm:grid-cols-2 lg:grid-cols-3">
          {categoryList.map((c) => {
            const count = productCounts[c.slug] || 0;
            return (
              <Link
                key={c.slug || c._id}
                to={`/category/${c.slug}`}
                className="group overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] transition-all hover:border-primary/50 hover:shadow-[var(--shadow-lift)] flex flex-col justify-between"
              >
                <div>
                  {c.image && (
                    <div className="mb-4 aspect-video w-full overflow-hidden rounded-xl bg-secondary">
                      <img
                        src={c.image}
                        alt={c.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}
                  <h2 className="font-display text-2xl group-hover:text-primary transition-colors">{c.name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{c.description}</p>
                </div>
                <p className="mt-6 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  {count} {count === 1 ? "piece" : "pieces"}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
