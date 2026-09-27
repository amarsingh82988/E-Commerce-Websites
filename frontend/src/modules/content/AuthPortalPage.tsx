import { Link } from "react-router-dom";
import { PageShell } from "@/components/site/Layout";
import { ShoppingBag, Store, ShieldCheck } from "lucide-react";

const portals = [
  {
    icon: ShoppingBag,
    title: "Customer",
    subtitle: "Shop, track orders & manage your account",
    badge: null,
    badgeClass: "",
    login: "/login",
    register: "/register",
    loginLabel: "Sign in",
    registerLabel: "Create account",
    cardClass: "border-border hover:border-accent/60",
    iconClass: "bg-accent/10 text-accent",
  },
  {
    icon: Store,
    title: "Seller",
    subtitle: "List products and manage your store",
    badge: "Seller Portal",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
    login: "/seller/login",
    register: "/seller/register",
    loginLabel: "Seller sign in",
    registerLabel: "Become a seller",
    cardClass: "border-primary/30 hover:border-primary/60",
    iconClass: "bg-primary/10 text-primary",
  },
  {
    icon: ShieldCheck,
    title: "Super Admin",
    subtitle: "Full platform control & management",
    badge: "Super Admin",
    badgeClass: "bg-rose-500/10 text-rose-600 border-rose-500/20",
    login: "/superadmin/login",
    register: null,
    loginLabel: "Admin sign in",
    registerLabel: null,
    cardClass: "border-rose-500/20 hover:border-rose-500/50",
    iconClass: "bg-rose-500/10 text-rose-600",
  },
];

export default function AuthPortalPage() {
  return (
    <PageShell>
      <div className="container-page flex min-h-[80vh] flex-col items-center justify-center py-20">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="font-display text-4xl md:text-5xl">Welcome to Apne Hath Crafts</h1>
          <p className="mt-4 text-muted-foreground">
            Choose how you'd like to continue
          </p>
        </div>

        {/* Portal Cards */}
        <div className="grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
          {portals.map((portal) => (
            <div
              key={portal.title}
              className={`flex flex-col rounded-3xl border-2 bg-card p-6 shadow-soft transition-all duration-200 ${portal.cardClass}`}
            >
              {/* Badge */}
              <div className="mb-4 flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                    portal.badge ? portal.badgeClass : "invisible"
                  }`}
                >
                  {portal.badge ?? "placeholder"}
                </span>
              </div>

              {/* Icon + Title */}
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${portal.iconClass}`}>
                <portal.icon className="h-6 w-6" />
              </div>
              <h2 className="font-display text-2xl">{portal.title}</h2>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">{portal.subtitle}</p>

              {/* Actions */}
              <div className="mt-6 flex flex-col gap-2">
                <Link
                  to={portal.login}
                  className="flex h-10 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition hover:opacity-90"
                >
                  {portal.loginLabel}
                </Link>
                {portal.register && (
                  <Link
                    to={portal.register}
                    className="flex h-10 items-center justify-center rounded-xl border border-border px-4 text-sm font-medium text-foreground transition hover:bg-secondary"
                  >
                    {portal.registerLabel}
                  </Link>
                )}
                {!portal.register && (
                  <p className="text-center text-xs text-muted-foreground">
                    Access by invite only
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom link */}
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Just browsing?{" "}
          <Link to="/shop" className="text-accent underline underline-offset-4">
            Continue to shop
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
