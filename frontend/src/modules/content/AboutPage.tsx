import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PageHeader, PageShell } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import story from "@/assets/story-hands.jpg";
import hero from "@/assets/hero-crochet.jpg";

import { loadContent, type SiteContent } from "@/store/content";
import { getSiteContent } from "@/api/content";

const values = [
  {
    title: "Made by hand, never by machine",
    body: "Every stitch is worked by hand. No two pieces are identical, and that is exactly the point.",
  },
  {
    title: "Small batches, real people",
    body: "We make in tiny runs so we can keep our quality high and pay our makers fairly.",
  },
  {
    title: "Yarn we would keep",
    body: "Soft, skin-friendly cottons and premium acrylics chosen so your piece lasts for years.",
  },
  {
    title: "Made to be gifted",
    body: "Wrapped with care, a handwritten note, and packaging you will not want to throw away.",
  },
];

export default function AboutPage() {
  const [siteContent, setSiteContent] = useState<SiteContent>(loadContent());

  useEffect(() => {
    getSiteContent().then((data) => {
      if (data) setSiteContent(data);
    });
  }, []);

  const about = siteContent.about;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Our story"
        title="Little things, made by hand"
        intro="Apne Hath Crochet began at a kitchen table with one hook, one ball of cotton, and far too much patience."
      />

      <section className="container-page grid items-center gap-8 py-16 md:grid-cols-2 md:py-24">
        <img
          src={about.imageUrl || story}
          alt="Hands crocheting a flower with a metal hook and cotton yarn"
          className="rounded-3xl object-cover shadow-soft"
          loading="lazy"
        />
        <div>
          <h2 className="font-display text-3xl md:text-4xl">{about.title}</h2>
          <p className="mt-4 text-muted-foreground whitespace-pre-line">
            {about.content}
          </p>
          <Button asChild className="mt-6">
            <Link to="/shop">Explore the collection</Link>
          </Button>
        </div>
      </section>

      <section className="border-y border-border bg-secondary/40 py-10 md:py-16">
        <div className="container-page">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 pb-4 border-b border-border/60">
            <h2 className="font-display text-3xl md:text-4xl shrink-0">The way we make things</h2>
            <div className="hidden md:block h-6 w-px bg-border shrink-0"></div>
            <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-widest text-primary shrink-0 w-fit">
              What we believe
            </div>
          </div>
          <div className="mt-6 md:mt-10 grid gap-6 sm:grid-cols-2">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-border bg-card p-6 shadow-sm flex items-start gap-4">
                <div className="flex shrink-0 size-8 items-center justify-center rounded-full bg-primary/10 text-primary mt-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold">{v.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{v.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page grid items-center gap-8 py-10 md:py-16 md:grid-cols-2">
        <div>
          <p className="eyebrow">Made for you</p>
          <h2 className="mt-3 font-display text-3xl md:text-4xl">Want something that does not exist yet?</h2>
          <p className="mt-4 text-muted-foreground">
            Tell us the colours, the size and the occasion. We will sketch it, quote it and crochet it just
            for you — from bridal bouquets to a tiny replica of your pet.
          </p>
          <Button asChild variant="secondary" className="mt-6">
            <Link to="/custom-orders">Start a custom order</Link>
          </Button>
        </div>
        <img
          src={hero}
          alt="A basket of finished crochet flowers and yarn in warm neutral tones"
          className="rounded-3xl object-cover shadow-soft"
          loading="lazy"
        />
      </section>
    </PageShell>
  );
}
