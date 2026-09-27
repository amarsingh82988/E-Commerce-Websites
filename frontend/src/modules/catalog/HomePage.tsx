import { Link } from "react-router-dom";
import { ArrowRight, Gift, HandHeart, PackageCheck, Sparkles, Star } from "lucide-react";
import { PageShell } from "@/components/site/Layout";
import { ProductCard } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { type Category } from "@/data/catalog";
import heroImage from "@/assets/hero-crochet.jpg";
import storyImage from "@/assets/story-hands.jpg";

import { loadContent, type SiteContent } from "@/store/content";

const benefits = [
  { icon: HandHeart, title: "Handmade with Love", text: "Every stitch worked by hand, never machine-made." },
  { icon: Sparkles, title: "Premium Materials", text: "Soft, long-lasting cotton and milk-cotton yarns." },
  { icon: PackageCheck, title: "Carefully Packed", text: "Gift-ready packaging with a handwritten note." },
  { icon: Gift, title: "Made for You", text: "Colours, sizes and details customised on request." },
];

import { useState, useEffect } from "react";
import { getPublicProducts } from "@/api/product";
import { getPublicCategories } from "@/api/category";
import { getSiteContent } from "@/api/content";

export default function Home() {
  const [bestsellerList, setBestsellerList] = useState<any[]>([]);
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent>(loadContent());

  useEffect(() => {
    getPublicProducts({ limit: 4 }).then((res) => {
      if (res && res.products) {
        setBestsellerList(res.products);
      }
    });

    getPublicCategories().then((cats) => {
      if (cats) {
        setCategoryList(cats);
      }
    });

    getSiteContent().then((data) => {
      if (data) setSiteContent(data);
    });
  }, []);

  const featuredReviews: any[] = [];
  const hero = siteContent.hero;


  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="container-page grid items-center gap-12 py-14 md:grid-cols-2 md:py-24">
          <div>
            <p className="eyebrow">Handcrafted with patience</p>
            <h1 className="mt-4 font-display text-5xl leading-[1.05] md:text-6xl lg:text-7xl whitespace-pre-line">
              {hero.title}
            </h1>
            <p className="mt-6 max-w-md text-lg text-muted-foreground">
              {hero.subtitle}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to={hero.buttonLink}>{hero.buttonText}</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/about">Explore Handmade</Link>
              </Button>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Star className="size-4 fill-accent text-accent" /> 4.9 average rating
              </span>
              <span>1,200+ happy homes</span>
            </div>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] border border-border shadow-[var(--shadow-lift)]">
              <img
                src={hero.imageUrl || heroImage}
                alt="Hero banner"
                width={1600}
                height={1104}
                className="size-full object-cover"
              />
            </div>
            <div className="absolute -bottom-5 left-6 rounded-2xl border border-border bg-card px-5 py-3 shadow-[var(--shadow-soft)] md:-left-6">
              <p className="font-display text-lg">Made slowly. Loved deeply.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-20">
        <SectionHead
          eyebrow="Browse"
          title="Featured Categories"
          intro="From forever bouquets to everyday totes — find the piece that feels like you."
        />
        <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {categoryList.slice(0, 7).map((c) => (
            <Link
              key={c.slug}
              to={`/category/${c.slug}`}
              className="group overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-soft)] transition-all hover:border-primary/50 hover:shadow-[var(--shadow-lift)] flex flex-col justify-between"
            >
              <div>
                {c.image && (
                  <div className="mb-3 aspect-video w-full overflow-hidden rounded-xl bg-secondary">
                    <img
                      src={c.image}
                      alt={c.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <h3 className="font-display text-lg group-hover:text-primary transition-colors">{c.name}</h3>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground leading-relaxed">{c.description}</p>
              </div>
              <div className="mt-4 flex items-center text-xs font-semibold text-primary">
                Explore <ArrowRight className="ml-1 size-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Bestsellers */}
      <section className="bg-secondary/40 py-20">
        <div className="container-page">
          <SectionHead eyebrow="Loved most" title="Best Sellers" intro="The pieces our customers keep coming back for." />
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {bestsellerList.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}

          </div>
          <div className="mt-10 text-center">
            <Button asChild variant="outline" size="lg">
              <Link to="/shop">
                View all products <ArrowRight className="ml-1 size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="container-page py-20">
        <SectionHead eyebrow="Why us" title="Why Apne Hath Crochet?" />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((b) => (
            <div key={b.title} className="rounded-2xl border border-border bg-card p-6 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-secondary">
                <b.icon className="size-5 text-accent" />
              </div>
              <h3 className="mt-4 font-display text-lg">{b.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Story */}
      <section className="bg-secondary/40 py-20">
        <div className="container-page grid items-center gap-12 md:grid-cols-2">
          <div className="overflow-hidden rounded-[2rem] border border-border shadow-[var(--shadow-soft)]">
            <img
              src={storyImage}
              alt="Hands crocheting a cream flower with a wooden hook"
              loading="lazy"
              width={1200}
              height={912}
              className="size-full object-cover"
            />
          </div>
          <div>
            <p className="eyebrow">Our story</p>
            <h2 className="mt-3 font-display text-4xl">The hands behind the hooks</h2>
            <p className="mt-5 text-muted-foreground">
              Apne Hath Crochet began at a kitchen table with one ball of cream cotton and a wooden hook. What
              started as a way to slow down became a small studio where every bouquet, bag and bear is worked
              row by row, by hand.
            </p>
            <p className="mt-3 text-muted-foreground">
              We make in small batches on purpose. It takes longer, but it means each piece leaves our hands
              only when it feels right — the way something made for someone you love should.
            </p>
            <Button asChild variant="outline" className="mt-7">
              <Link to="/about">Read our story</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Custom orders CTA */}
      <section className="container-page py-20">
        <div className="rounded-[2rem] border border-border bg-card px-8 py-16 text-center shadow-[var(--shadow-soft)]">
          <p className="eyebrow">Custom crochet</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl">Want Something Made Just for You?</h2>
          <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
            Tell us the colours, the size and the story behind it. We'll crochet a one-of-a-kind piece, just
            for you.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/custom-orders">Request Custom Order</Link>
          </Button>
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-secondary/40 py-20">
        <div className="container-page">
          <SectionHead eyebrow="Kind words" title="Customer Reviews" />
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {featuredReviews.length > 0 ? (
              featuredReviews.map((t) => (
                <figure key={t.id} className="rounded-2xl border border-border bg-card p-6 flex flex-col h-full">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <Star key={i} className="size-4 fill-accent text-accent" />
                    ))}
                  </div>
                  <blockquote className="mt-4 text-sm leading-relaxed text-muted-foreground flex-1">
                    "{t.content}"
                  </blockquote>
                  {t.reply && (
                    <div className="mt-4 bg-secondary/40 p-3 rounded-lg text-xs">
                      <span className="font-medium">Apne Hath Crochet:</span> {t.reply}
                    </div>
                  )}
                  <figcaption className="mt-5 text-sm font-medium">
                    {t.author}
                  </figcaption>
                </figure>
              ))
            ) : (
              <div className="col-span-3 text-center text-muted-foreground py-10">
                Check back soon for new reviews!
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Instagram */}
      <section className="container-page py-20">
        <SectionHead eyebrow="@apnehathcrochet" title="From our studio" intro="Follow along for works in progress and new drops." />
        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-4">
          {bestsellerList.slice(0, 4).map((p: any) => (
            <div key={p.id} className="aspect-square overflow-hidden rounded-2xl border border-border bg-secondary">
              <img
                src={p.featuredImage}
                alt={p.name}
                loading="lazy"
                width={900}
                height={900}
                className="size-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function SectionHead({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <div className="text-center">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-3 font-display text-4xl">{title}</h2>
      {intro && <p className="mx-auto mt-3 max-w-lg text-muted-foreground">{intro}</p>}
    </div>
  );
}
