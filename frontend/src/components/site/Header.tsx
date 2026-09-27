import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useShop } from "@/store/shop";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const nav = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/categories", label: "Categories" },
  { to: "/custom-orders", label: "Custom Orders" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const { cartCount, wishlist } = useShop();
  const navigate = useNavigate();

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    setSearchOpen(false);
    setOpen(false);
    void navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4 md:h-20">
        <button
          className="md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>

        <Link to="/" className="flex flex-col leading-none">
          <span className="font-display text-xl tracking-tight md:text-2xl">Apne Hath Crochet</span>
          <span className="hidden text-[0.6rem] tracking-[0.3em] text-muted-foreground uppercase md:block">
            Handcrafted with patience
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm md:flex">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `transition-colors hover:text-accent ${
                  isActive ? "text-foreground" : "text-muted-foreground"
                }`
              }
              end={item.to === "/"}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            aria-label="Search"
            className="rounded-full p-2 transition-colors hover:bg-secondary"
            onClick={() => setSearchOpen((v) => !v)}
          >
            <Search className="size-5" />
          </button>
          <Link
            to="/wishlist"
            aria-label="Wishlist"
            className="relative rounded-full p-2 transition-colors hover:bg-secondary"
          >
            <Heart className="size-5" />
            {wishlist.length > 0 && <Dot>{wishlist.length}</Dot>}
          </Link>
          <Link
            to="/cart"
            aria-label="Cart"
            className="relative rounded-full p-2 transition-colors hover:bg-secondary"
          >
            <ShoppingBag className="size-5" />
            {cartCount > 0 && <Dot>{cartCount}</Dot>}
          </Link>
          <Link
            to="/profile"
            aria-label="Account"
            className="hidden rounded-full p-2 transition-colors hover:bg-secondary md:block"
          >
            <User className="size-5" />
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-border bg-card">
          <form onSubmit={submitSearch} className="container-page flex gap-2 py-3">
            <Input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for bouquets, bags, keychains…"
            />
            <Button type="submit">Search</Button>
          </form>
        </div>
      )}

      {open && (
        <nav className="border-t border-border bg-card md:hidden">
          <ul className="container-page flex flex-col py-2">
            {nav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block py-3 text-sm ${isActive ? "text-foreground" : "text-muted-foreground"}`
                  }
                  end={item.to === "/"}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
            <li>
              <Link to="/profile" onClick={() => setOpen(false)} className="block py-3 text-sm text-muted-foreground">
                Account
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

function Dot({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute top-0 right-0 flex size-4 items-center justify-center rounded-full bg-accent text-[0.6rem] font-semibold text-accent-foreground">
      {children}
    </span>
  );
}
