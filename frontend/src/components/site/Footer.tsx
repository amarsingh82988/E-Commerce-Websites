import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const columns = [
  {
    title: "Shop",
    links: [
      { to: "/shop", label: "All Products" },
      { to: "/shop", label: "New Arrivals", search: { sort: "newest" } },
      { to: "/shop", label: "Best Sellers", search: { sort: "bestselling" } },
      { to: "/custom-orders", label: "Custom Orders" },
    ],
  },
  {
    title: "Help",
    links: [
      { to: "/contact", label: "Contact" },
      { to: "/faq", label: "FAQ" },
      { to: "/shipping-policy", label: "Shipping" },
      { to: "/return-policy", label: "Returns" },
      { to: "/track-order", label: "Track Order" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about", label: "About Us" },
      { to: "/about", label: "Our Story" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/privacy-policy", label: "Privacy Policy" },
      { to: "/terms", label: "Terms" },
      { to: "/return-policy", label: "Refund Policy" },
    ],
  },
] as const;

export function Footer() {
  const sellerInsta = import.meta.env.VITE_SELLER_INSTAGRAM || "https://instagram.com/apnehathcrochet";
  const sellerFb = import.meta.env.VITE_SELLER_FACEBOOK || "https://facebook.com/apnehathcrochet";
  const sellerYt = import.meta.env.VITE_SELLER_YOUTUBE || "https://youtube.com/@apnehathcrochet";

  return (
    <footer className="mt-24 border-t border-border bg-secondary/50">
      <div className="container-page grid gap-12 py-16 md:grid-cols-[1.4fr_repeat(4,1fr)]">
        <div className="max-w-sm">
          <p className="font-display text-2xl">Apne Hath Crochet</p>
          <p className="mt-3 text-sm text-muted-foreground">
            Little things, made by hand. Every piece is crocheted slowly in small batches, in our home studio.
          </p>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="eyebrow">{col.title}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    to={"search" in l ? { pathname: l.to, search: new URLSearchParams(l.search).toString() } : l.to}
                    className="text-muted-foreground transition-colors hover:text-accent"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

            <div className="container-page flex flex-col items-center justify-between gap-4 border-t border-border py-6 text-xs text-muted-foreground md:flex-row">
        <p>c {new Date().getFullYear()} Apne Hath Crochet. Made slowly, loved deeply.</p>
        <div className="flex items-center gap-5">
          <a href={sellerInsta} target="_blank" rel="noreferrer" className="hover:text-accent">
            Instagram
          </a>
          <a href={sellerFb} target="_blank" rel="noreferrer" className="hover:text-accent">
            Facebook
          </a>
          <a href={sellerYt} target="_blank" rel="noreferrer" className="hover:text-accent">
            YouTube
          </a>
          <Link to="/seller/login">
            <Button variant="outline" size="sm" className="h-7 text-xs rounded-full px-3">Seller Portal</Button>
          </Link>
        </div>
      </div>
    </footer>
  );
}
