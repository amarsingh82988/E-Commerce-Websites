import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Package,
  FolderTree,
  ShoppingCart,
  PenTool,
  Users,
  Star,
  Ticket,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  ShieldCheck,
  Store,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ui/theme-toggle";

// Nav items with optional role restriction
const allNavItems = [
  { name: "Dashboard",      to: "/seller/dashboard",     icon: LayoutDashboard, roles: ["seller", "superadmin"] },
  { name: "Products",       to: "/seller/products",       icon: Package,          roles: ["seller", "superadmin"] },
  { name: "Categories",     to: "/seller/categories",     icon: FolderTree,       roles: ["seller", "superadmin"] },
  { name: "Orders",         to: "/seller/orders",         icon: ShoppingCart,     roles: ["seller", "superadmin"] },
  { name: "Custom Orders",  to: "/seller/custom-orders",  icon: PenTool,          roles: ["seller", "superadmin"] },
  { name: "Reviews",        to: "/seller/reviews",        icon: Star,             roles: ["seller", "superadmin"] },
  { name: "Content",        to: "/seller/content",        icon: FileText,         roles: ["seller", "superadmin"] },
  { name: "Coupons",        to: "/seller/coupons",        icon: Ticket,           roles: ["seller", "superadmin"] },
  // SuperAdmin only
  { name: "Customers",      to: "/seller/customers",      icon: Users,            roles: ["superadmin"] },
  { name: "Settings",       to: "/seller/settings",       icon: Settings,         roles: ["superadmin"] },
];

export function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const role = user?.role ?? "seller";
  const visibleNav = allNavItems.filter((item) => item.roles.includes(role));

  const handleLogout = async () => {
    await logout();
    toast.success("Logged out successfully");
    navigate("/seller/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-secondary/10">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 -translate-x-full border-r border-border bg-card transition-transform md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : ""
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            {role === "superadmin" ? (
              <ShieldCheck className="h-5 w-5 text-rose-600" />
            ) : (
              <Store className="h-5 w-5 text-primary" />
            )}
            <span className="font-display text-base tracking-tight">
              {role === "superadmin" ? "Super Admin" : "Seller Console"}
            </span>
          </div>
          <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="size-5" />
          </button>
        </div>

        {/* Role badge */}
        <div className="border-b border-border px-4 py-3">
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          <Badge
            variant="outline"
            className={`mt-1 text-xs capitalize ${
              role === "superadmin"
                ? "border-rose-500/30 bg-rose-500/10 text-rose-600"
                : "border-primary/30 bg-primary/10 text-primary"
            }`}
          >
            {role === "superadmin" ? "Super Admin" : "Seller"}
          </Badge>
        </div>

        {/* Nav */}
        <div className="h-[calc(100vh-8.5rem)] overflow-y-auto p-3">
          <nav className="flex flex-col space-y-0.5">
            {visibleNav.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "bg-accent/10 text-accent font-medium"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`
                }
              >
                <item.icon className="size-4 shrink-0" />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:px-8">
          <div className="flex items-center gap-4">
            <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="size-5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <NavLink
              to="/seller/profile"
              className={({ isActive }) =>
                `flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition-colors ${
                  isActive ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary"
                }`
              }
            >
              <User className="h-4 w-4" />
              {user?.name?.split(" ")[0] || "Profile"}
            </NavLink>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Log out">
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
