import { useMemo, useState, useEffect } from "react";
import { SlidersHorizontal } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type Category, type Product } from "@/data/catalog";
import { formatINR } from "@/lib/format";
import { getPublicProducts } from "@/api/product";
import { getPublicCategories } from "@/api/category";

export type ShopSearch = {
  q?: string | undefined;
  category?: string | undefined;
  sort?: string | undefined;
  page?: number | undefined;
};

const PAGE_SIZE = 8;

const sortOptions = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "bestselling", label: "Best selling" },
  { value: "rating", label: "Highest rated" },
];

export function ProductGrid({
  search,
  lockedCategory,
}: {
  search: ShopSearch;
  lockedCategory?: string;
}) {
  const [productList, setProductList] = useState<Product[]>([]);
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [sort, setSort] = useState(search.sort ?? "featured");
  const [selectedCats, setSelectedCats] = useState<string[]>(
    lockedCategory ? [lockedCategory] : search.category ? [search.category] : [],
  );
  const [maxPrice, setMaxPrice] = useState(2500);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    Promise.all([getPublicCategories(), getPublicProducts({ limit: 100 })])
      .then(([cats, res]) => {
        if (cats) setCategoryList(cats);
        if (res && res.products) setProductList(res.products);
      });
  }, []);

  const filtered = useMemo(() => {
    const q = (search.q ?? "").toLowerCase().trim();
    let list = productList.filter((p) => {
      if (q && !`${p.name} ${p.shortDescription} ${p.tags.join(" ")}`.toLowerCase().includes(q)) return false;
      if (selectedCats.length && !selectedCats.includes(p.category)) return false;
      if (p.price > maxPrice) return false;
      if (inStockOnly && p.stock <= 0) return false;
      if (p.rating < minRating) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "newest":
          return b.createdAt.localeCompare(a.createdAt);
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "bestselling":
          return b.reviewCount - a.reviewCount;
        case "rating":
          return b.rating - a.rating;
        default:
          return Number(b.featured) - Number(a.featured);
      }
    });
    return list;
  }, [search.q, selectedCats, maxPrice, inStockOnly, minRating, sort, productList]);


  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const visible = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const toggleCat = (slug: string) => {
    setPage(1);
    setSelectedCats((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  };

  return (
    <div className="container-page grid gap-10 py-12 lg:grid-cols-[260px_1fr]">
      <aside className={`${showFilters ? "block" : "hidden"} lg:block`}>
        <div className="space-y-8 rounded-2xl border border-border bg-card p-6">
          {!lockedCategory && (
            <div>
              <h3 className="eyebrow">Category</h3>
              <div className="mt-4 space-y-3">
                {categoryList.map((c) => (

                  <div key={c.slug} className="flex items-center gap-2.5">
                    <Checkbox
                      id={`cat-${c.slug}`}
                      checked={selectedCats.includes(c.slug)}
                      onCheckedChange={() => toggleCat(c.slug)}
                    />
                    <Label htmlFor={`cat-${c.slug}`} className="text-sm font-normal">
                      {c.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h3 className="eyebrow">Max price</h3>
            <Slider
              className="mt-5"
              min={200}
              max={2500}
              step={100}
              value={[maxPrice]}
              onValueChange={(v) => {
                setMaxPrice(v[0] ?? 2500);
                setPage(1);
              }}
            />
            <p className="mt-3 text-sm text-muted-foreground">Up to {formatINR(maxPrice)}</p>
          </div>

          <div>
            <h3 className="eyebrow">Availability</h3>
            <div className="mt-4 flex items-center gap-2.5">
              <Checkbox
                id="in-stock"
                checked={inStockOnly}
                onCheckedChange={(v) => {
                  setInStockOnly(Boolean(v));
                  setPage(1);
                }}
              />
              <Label htmlFor="in-stock" className="text-sm font-normal">
                In stock only
              </Label>
            </div>
          </div>

          <div>
            <h3 className="eyebrow">Rating</h3>
            <div className="mt-4 space-y-3">
              {[0, 4, 4.5].map((r) => (
                <div key={r} className="flex items-center gap-2.5">
                  <Checkbox
                    id={`rating-${r}`}
                    checked={minRating === r}
                    onCheckedChange={() => {
                      setMinRating(r);
                      setPage(1);
                    }}
                  />
                  <Label htmlFor={`rating-${r}`} className="text-sm font-normal">
                    {r === 0 ? "All ratings" : `${r} stars & up`}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "piece" : "pieces"}
            {search.q ? ` for "${search.q}"` : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="lg:hidden"
              onClick={() => setShowFilters((v) => !v)}
            >
              <SlidersHorizontal className="mr-1 size-4" /> Filters
            </Button>
            <Select
              value={sort}
              onValueChange={(v) => {
                setSort(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[190px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="mt-16 rounded-2xl border border-dashed border-border py-20 text-center">
            <p className="font-display text-2xl">Nothing here yet</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Try removing a filter or searching for something else.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {pageCount > 1 && (
          <div className="mt-12 flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" disabled={current === 1} onClick={() => setPage(current - 1)}>
              Previous
            </Button>
            <span className="px-3 text-sm text-muted-foreground">
              Page {current} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={current === pageCount}
              onClick={() => setPage(current + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
