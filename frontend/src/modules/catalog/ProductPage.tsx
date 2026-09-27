import { useState, useEffect, useCallback } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Heart, Minus, Plus, Star, Truck, CheckCircle2, Clock, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/site/Layout";
import { ProductCard } from "@/components/site/ProductCard";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import DOMPurify from "dompurify";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/format";
import { type Product } from "@/data/catalog";
import { useShop } from "@/store/shop";
import { getProductBySlug, getPublicProducts } from "@/api/product";
import { useAuth } from "@/context/AuthContext";
import { getProductReviews, createReview, type ReviewItem } from "@/api/reviews";
import { uploadImage } from "@/api/upload";

export default function ProductPage() {
  const { slug } = useParams();
  const { addToCart, toggleWishlist, inWishlist } = useShop();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  // Reviews state
  const [approvedReviews, setApprovedReviews] = useState<ReviewItem[]>([]);
  const [userPendingReview, setUserPendingReview] = useState<ReviewItem | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Review Form state
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: "", comment: "" });
  const [reviewImage, setReviewImage] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [uploadingReviewImg, setUploadingReviewImg] = useState(false);

  useEffect(() => {
    if (slug) {
      setLoading(true);
      getProductBySlug(slug).then((data) => {
        if (data) {
          setProduct(data);
          if (data.colors && data.colors.length > 0) setColor(data.colors[0]);
          if (data.sizes && data.sizes.length > 0) setSize(data.sizes[0]);
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (product?.category) {
      getPublicProducts({ category: product.category, limit: 4 }).then((res) => {
        if (res && res.products && res.products.length > 0) {
          setRelatedProducts(res.products.filter((p) => p.id !== product.id && p.slug !== product.slug).slice(0, 3));
        }
      });
    }
  }, [product]);

  // Fetch reviews for this product from backend
  const fetchReviews = useCallback(async () => {
    if (!product?.id) return;
    setLoadingReviews(true);
    try {
      const res = await getProductReviews(product.id);
      setApprovedReviews(res.approved || []);
      setUserPendingReview(res.userPending || null);
    } catch {
      // quiet fallback
    } finally {
      setLoadingReviews(false);
    }
  }, [product?.id]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Upload optional review image (JPG only, max 10MB)
  const handleReviewImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/") || /\.(jpg|jpeg|png|webp|gif)$/i.test(file.name);
    if (!isImage) {
      toast.error("Only image files are allowed.");
      e.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10 MB limit.");
      e.target.value = "";
      return;
    }

    setUploadingReviewImg(true);
    try {
      const url = await uploadImage(file);
      setReviewImage(url);
      toast.success("Review image attached!");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image.");
    } finally {
      setUploadingReviewImg(false);
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to submit a review.");
      return;
    }
    if (!product?.id) return;
    if (!reviewForm.comment.trim()) {
      toast.error("Please enter a review comment.");
      return;
    }

    setReviewSubmitting(true);
    try {
      const res = await createReview({
        productId: product.id,
        rating: reviewForm.rating,
        title: reviewForm.title,
        comment: reviewForm.comment,
        images: reviewImage ? [reviewImage] : [],
      });

      toast.success(res.message || "Review submitted! Pending seller approval.");
      setReviewForm({ rating: 5, title: "", comment: "" });
      setReviewImage("");
      fetchReviews();
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review.");
    } finally {
      setReviewSubmitting(false);
    }
  };

  if (!loading && !product) {
    return <Navigate to="/shop" replace />;
  }

  if (!product) {
    return (
      <PageShell>
        <div className="container-page py-20 text-center text-muted-foreground">Loading product...</div>
      </PageShell>
    );
  }

  const outOfStock = (product.stock ?? 0) <= 0;
  const wished = inWishlist(product.id);
  const productImages = (product.images && product.images.length > 0)
    ? product.images
    : product.featuredImage
      ? [product.featuredImage]
      : [];

  const displayRelated = relatedProducts;

  const add = () => {
    addToCart({ productId: product.id, qty, color, size, note: note.trim() });
    toast.success("Added to your cart ♡");
  };

  return (
    <PageShell>
      <div className="container-page py-8">
        <nav className="text-xs text-muted-foreground">
          <Link to="/" className="hover:text-accent">
            Home
          </Link>{" "}
          /{" "}
          <Link to="/shop" className="hover:text-accent">
            Shop
          </Link>{" "}
          / <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="mt-6 grid gap-12 lg:grid-cols-2">
          <div>
            <div className="overflow-hidden rounded-[1.75rem] border border-border bg-secondary">
              <img
                src={productImages[activeImage] || product.featuredImage}
                alt={product.name}
                width={900}
                height={1100}
                className="size-full object-cover"
              />
            </div>
            {productImages.length > 1 && (
              <div className="mt-4 flex gap-3">
                {productImages.map((img: string, i: number) => (
                  <button
                    key={img}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "size-20 overflow-hidden rounded-xl border-2",
                      i === activeImage ? "border-accent" : "border-border",
                    )}
                  >
                    <img src={img} alt="" loading="lazy" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="eyebrow">{product.sku}</p>
            <h1 className="mt-2 font-display text-4xl md:text-5xl">{product.name}</h1>

            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn("size-4", i < Math.round(product.rating || 0) && "fill-accent text-accent")}
                  />
                ))}
              </span>
              {(product.rating || 0).toFixed(1)} · {approvedReviews.length || product.reviewCount || 0} reviews
            </div>

            <div className="mt-5 flex items-baseline gap-3">
              <span className="text-3xl font-semibold">{formatINR(product.price)}</span>
              {product.compareAtPrice && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    {formatINR(product.compareAtPrice)}
                  </span>
                  <span className="rounded-full bg-accent px-2.5 py-1 text-xs text-accent-foreground">
                    {Math.round(100 - (product.price / product.compareAtPrice) * 100)}% off
                  </span>
                </>
              )}
            </div>

            <p className="mt-5 text-muted-foreground" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(product.description || "") }}></p>

            <p className="mt-5 text-sm">
              {outOfStock ? (
                <span className="text-destructive">Currently unavailable</span>
              ) : product.stock <= 5 ? (
                <span className="text-accent">Only {product.stock} left — made to order after that</span>
              ) : (
                <span className="text-muted-foreground">In stock, ready to ship</span>
              )}
            </p>

            {product.colors && product.colors.length > 0 && (
              <OptionRow label="Colour" options={product.colors} value={color} onChange={setColor} />
            )}
            {product.sizes && product.sizes.length > 1 && (
              <OptionRow label="Size" options={product.sizes} value={size} onChange={setSize} />
            )}

            {product.customizable && (
              <div className="mt-7">
                <p className="eyebrow">Make it yours</p>
                <Textarea
                  className="mt-3"
                  rows={3}
                  maxLength={300}
                  placeholder="Add your customization request — a name, a colour, a note for the card…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            )}

            <div className="mt-7 flex items-center gap-4">
              <div className="flex items-center rounded-full border border-border">
                <button
                  aria-label="Decrease quantity"
                  className="p-3 disabled:opacity-40"
                  disabled={qty <= 1}
                  onClick={() => setQty((q) => q - 1)}
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-8 text-center text-sm">{qty}</span>
                <button
                  aria-label="Increase quantity"
                  className="p-3 disabled:opacity-40"
                  disabled={qty >= product.stock}
                  onClick={() => setQty((q) => q + 1)}
                >
                  <Plus className="size-4" />
                </button>
              </div>
              <Button
                aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
                variant="outline"
                size="icon"
                className="size-12 rounded-full"
                onClick={() => {
                  toggleWishlist(product.id);
                  toast.success(wished ? "Removed from wishlist" : "Saved to your wishlist ♡");
                }}
              >
                <Heart className={cn("size-5", wished && "fill-accent text-accent")} />
              </Button>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="flex-1" disabled={outOfStock} onClick={add}>
                {outOfStock ? "Currently unavailable" : "Add to Cart"}
              </Button>
              <Button asChild size="lg" variant="outline" className="flex-1" disabled={outOfStock}>
                <Link to="/checkout" onClick={add}>
                  Buy Now
                </Link>
              </Button>
            </div>

            <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
              <Truck className="size-4" /> Ships in {product.estimatedDelivery}
            </p>

            <Accordion type="single" collapsible className="mt-8">
              <AccordionItem value="materials">
                <AccordionTrigger>Materials</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{product.materials}</AccordionContent>
              </AccordionItem>
              <AccordionItem value="care">
                <AccordionTrigger>Care instructions</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{product.careInstructions}</AccordionContent>
              </AccordionItem>
              <AccordionItem value="shipping">
                <AccordionTrigger>Shipping &amp; returns</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Dispatched in {product.estimatedDelivery}. Free shipping on orders above ₹1,499. Returns
                  accepted within 7 days for non-customised pieces.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* Dynamic Reviews Section */}
        <section className="mt-20 border-t border-border pt-12">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl">Customer Reviews</h2>
            <Badge variant="outline" className="text-xs">
              Verified Buyer Reviews
            </Badge>
          </div>

          {/* User Pending Review Notice */}
          {userPendingReview && (
            <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 dark:border-amber-900/60 dark:bg-amber-950/30 flex items-start gap-3">
              <Clock className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-sm text-amber-900 dark:text-amber-200">
                  Your review is currently pending seller approval
                </p>
                <p className="text-xs text-amber-700/80 dark:text-amber-400 mt-0.5">
                  "{userPendingReview.comment}" ({userPendingReview.rating} Stars)
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 grid gap-12 lg:grid-cols-2">
            <div>
              {loadingReviews ? (
                <div className="py-8 text-center text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" /> Loading reviews...
                </div>
              ) : approvedReviews.length > 0 ? (
                <div className="space-y-6">
                  {approvedReviews.map((r) => (
                    <figure key={r._id} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn("size-4", i < r.rating ? "fill-accent text-accent" : "text-muted-foreground/40")}
                            />
                          ))}
                        </div>
                        <span className="flex items-center gap-1 text-[0.7rem] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-medium">
                          <CheckCircle2 className="size-3" /> Verified Buyer
                        </span>
                      </div>

                      {r.title && <h4 className="mt-3 font-semibold text-base">{r.title}</h4>}
                      <blockquote className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        "{r.comment}"
                      </blockquote>

                      {r.images && r.images.length > 0 && (
                        <div className="mt-3 flex gap-2">
                          {r.images.map((img, idx) => (
                            <a key={idx} href={img} target="_blank" rel="noreferrer">
                              <img src={img} alt="Review attachment" className="h-16 w-16 object-cover rounded-lg border shadow-sm hover:opacity-90 transition-opacity" />
                            </a>
                          ))}
                        </div>
                      )}

                      {r.sellerReply && (
                        <div className="mt-4 bg-secondary/60 p-3.5 rounded-xl text-xs space-y-1">
                          <span className="font-semibold text-foreground">Seller Response:</span>
                          <p className="text-muted-foreground">{r.sellerReply}</p>
                        </div>
                      )}

                      <figcaption className="mt-4 flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/50">
                        <span className="font-medium text-foreground">{r.userName}</span>
                        <span>{new Date(r.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
                  <p className="italic">No approved reviews yet for this product.</p>
                  <p className="text-xs mt-1">If you have purchased this item, submit your review below!</p>
                </div>
              )}
            </div>

            <div>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
                <h3 className="font-display text-xl mb-1">Write a Verified Buyer Review</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Only customers who have purchased this product can leave a review. All reviews are reviewed by the seller before appearing publicly.
                </p>

                {!user ? (
                  <div className="rounded-xl border border-border bg-muted/40 p-6 text-center">
                    <p className="text-sm text-muted-foreground">Please log in to submit a review for your purchase.</p>
                    <Button asChild size="sm" className="mt-3">
                      <Link to="/login">Log in to review</Link>
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={submitReview} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Rating *</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setReviewForm((f) => ({ ...f, rating: num }))}
                            className="p-1 transition-transform hover:scale-110"
                          >
                            <Star
                              className={cn(
                                "size-7 transition-colors",
                                num <= reviewForm.rating ? "fill-accent text-accent" : "text-muted-foreground/30"
                              )}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Review Title (Optional)</label>
                      <Input
                        placeholder="e.g. Beautiful craftsmanship & fast shipping!"
                        value={reviewForm.title}
                        onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-1 block">Your Review *</label>
                      <Textarea
                        placeholder="Share details about quality, sizing, color, or overall experience..."
                        rows={4}
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                        required
                      />
                    </div>

                    {/* Optional Image Upload */}
                    <div>
                      <label className="text-xs font-medium mb-1 block">Attach Photo (Optional, JPG max 10MB)</label>
                      {reviewImage ? (
                        <div className="relative w-20 h-20 border rounded-lg overflow-hidden group">
                          <img src={reviewImage} alt="Attachment" className="w-full h-full object-cover" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-5 w-5 rounded-full"
                            onClick={() => setReviewImage("")}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            type="file"
                            accept=".jpg,.jpeg,image/jpeg"
                            onChange={handleReviewImageUpload}
                            disabled={uploadingReviewImg}
                            className="text-xs cursor-pointer"
                          />
                          {uploadingReviewImg && <Loader2 className="h-4 w-4 animate-spin" />}
                        </div>
                      )}
                    </div>

                    <Button type="submit" size="lg" className="w-full" disabled={reviewSubmitting || uploadingReviewImg}>
                      {reviewSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                        </>
                      ) : (
                        "Submit Review for Seller Approval"
                      )}
                    </Button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {displayRelated.length > 0 && (
          <section className="mt-20">
            <h2 className="font-display text-3xl">You may also love</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {displayRelated.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </PageShell>
  );
}

function OptionRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mt-7">
      <p className="eyebrow">{label}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition-colors",
              value === o ? "border-accent bg-accent text-accent-foreground" : "border-border hover:bg-secondary",
            )}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}
