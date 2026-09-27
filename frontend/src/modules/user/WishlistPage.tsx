import { Link } from "react-router-dom";
import { PageHeader, PageShell } from "@/components/site/Layout";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { useShop } from "@/store/shop";

export default function WishlistPage() {
  const { wishlist, allProducts } = useShop();
  const items = wishlist.map((id) => allProducts.find((p) => p.id === id || p.slug === id)).filter(Boolean);

  return (
    <PageShell>
      <PageHeader eyebrow="Saved" title="Your Wishlist" intro="Pieces you've kept an eye on." />
      <div className="container-page py-12">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-20 text-center">
            <p className="font-display text-2xl">Nothing saved yet</p>
            <p className="mt-2 text-sm text-muted-foreground">Tap the heart on any piece to save it here.</p>
            <Button asChild className="mt-6">
              <Link to="/shop">Browse the collection</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((p) => p && <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>
    </PageShell>
  );
}
