import { Link } from "react-router-dom";
import { Heart, Star } from "lucide-react";
import { toast } from "sonner";
import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import { useShop } from "@/store/shop";
import { Button } from "@/components/ui/button";
import type { Product } from "@/data/catalog";

export function ProductCard({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, inWishlist } = useShop();
  const outOfStock = product.stock <= 0;
  const wished = inWishlist(product.id);

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-soft)] transition-shadow duration-300 hover:shadow-[var(--shadow-lift)]">
      <Link
        to={`/product/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden bg-secondary"
      >
        <img
          src={product.featuredImage}
          alt={product.name}
          loading="lazy"
          width={900}
          height={1100}
          className="size-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.compareAtPrice && (
            <span className="rounded-full bg-accent px-2.5 py-1 text-[0.65rem] font-medium tracking-wide text-accent-foreground uppercase">
              Save {Math.round(100 - (product.price / product.compareAtPrice) * 100)}%
            </span>
          )}
          {product.newArrival && (
            <span className="rounded-full bg-card px-2.5 py-1 text-[0.65rem] tracking-wide uppercase">New</span>
          )}
        </div>
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/65">
            <span className="rounded-full bg-card px-4 py-2 text-xs tracking-wide uppercase">
              Currently unavailable
            </span>
          </div>
        )}
      </Link>

      <button
        aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        onClick={() => {
          toggleWishlist(product.id);
          toast.success(wished ? "Removed from wishlist" : "Saved to your wishlist ♡");
        }}
        className="absolute top-3 right-3 rounded-full bg-card/90 p-2 shadow-[var(--shadow-soft)] transition-colors hover:bg-card"
      >
        <Heart className={cn("size-4", wished && "fill-accent text-accent")} />
      </button>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="size-3.5 fill-accent text-accent" />
          {product.rating.toFixed(1)}
          <span className="text-muted-foreground/70">({product.reviewCount})</span>
        </div>
        <h3 className="mt-1.5 font-display text-lg leading-snug">
          <Link to={`/product/${product.slug}`}>
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.shortDescription || "") }}></p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-base font-semibold">{formatINR(product.price)}</span>
          {product.compareAtPrice && (
            <span className="text-sm text-muted-foreground line-through">
              {formatINR(product.compareAtPrice)}
            </span>
          )}
        </div>
        <Button
          className="mt-4 w-full"
          variant="secondary"
          disabled={outOfStock}
          onClick={() => {
            addToCart({ productId: product.id, qty: 1 });
            toast.success("Added to your cart ♡");
          }}
        >
          {outOfStock ? "Currently unavailable" : "Add to Cart"}
        </Button>
      </div>
    </article>
  );
}
