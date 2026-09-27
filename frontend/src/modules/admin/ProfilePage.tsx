import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Store, Package, LogOut, Edit3, ShieldCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchApi } from "@/lib/api";

export default function SellerProfilePage() {
  const { user, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  // FIX: redirect via useEffect, not during render
  useEffect(() => {
    if (!loading && (!user || !["seller", "superadmin"].includes(user.role))) {
      navigate("/seller/login");
    }
  }, [loading, user, navigate]);

  // FIX: sync state after user loads
  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setPhone(user.phone ?? "");
    }
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetchApi("/auth/me", {
        method: "PUT",
        body: JSON.stringify({ name, phone }),
      });
      toast.success("Profile updated");
      refresh();
      setEditing(false);
    } catch {
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await fetchApi("/seller/logout", { method: "POST" }).catch(() => {});
    navigate("/seller/login");
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    );
  }

  // useEffect handles redirect; just return null while that happens
  if (!user || !["seller", "superadmin"].includes(user.role)) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {user.role === "superadmin" ? (
              <ShieldCheck className="h-8 w-8" />
            ) : (
              <Store className="h-8 w-8" />
            )}
          </div>
          <div>
            <h1 className="font-display text-2xl">{user.name || "Seller"}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <Badge
              variant="outline"
              className={`mt-1 text-xs capitalize ${
                user.role === "superadmin"
                  ? "border-rose-500/30 bg-rose-500/10 text-rose-600"
                  : "border-primary/30 bg-primary/10 text-primary"
              }`}
            >
              {user.role === "superadmin" ? "Super Admin" : "Seller"}
            </Badge>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2 text-muted-foreground">
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info" className="gap-2">
            <Store className="h-4 w-4" /> Account Info
          </TabsTrigger>
          <TabsTrigger value="access" className="gap-2">
            <Package className="h-4 w-4" /> Permissions
          </TabsTrigger>
        </TabsList>

        {/* ── Account Info ─────────────────────────────────────────────────── */}
        <TabsContent value="info" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your seller account details</CardDescription>
              </div>
              {!editing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setName(user.name); setPhone(user.phone); setEditing(true); }}
                  className="gap-2"
                >
                  <Edit3 className="h-4 w-4" /> Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  {editing ? (
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                  ) : (
                    <p className="rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm">{user.name || "—"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <p className="rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm text-muted-foreground">{user.email}</p>
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  {editing ? (
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                  ) : (
                    <p className="rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm">{user.phone || "—"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Account Role</Label>
                  <p className="rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm capitalize">{user.role}</p>
                </div>
              </div>
              {editing && (
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Permissions ──────────────────────────────────────────────────── */}
        <TabsContent value="access" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Permissions</CardTitle>
              <CardDescription>What you can access in the dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { label: "Manage Products", allowed: true },
                  { label: "Manage Categories", allowed: true },
                  { label: "View & Process Orders", allowed: true },
                  { label: "Reply to Reviews", allowed: true },
                  { label: "Manage Custom Orders", allowed: true },
                  { label: "Create / Edit Coupons", allowed: user.role === "superadmin" },
                  { label: "Delete Reviews", allowed: user.role === "superadmin" },
                  { label: "Site Settings", allowed: user.role === "superadmin" },
                  { label: "User Management", allowed: user.role === "superadmin" },
                ].map((perm) => (
                  <div key={perm.label} className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm">
                    <span>{perm.label}</span>
                    <span className={perm.allowed ? "text-green-600" : "text-muted-foreground"}>
                      {perm.allowed ? "✅ Allowed" : "🔒 Restricted"}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
