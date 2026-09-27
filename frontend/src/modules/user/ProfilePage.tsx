import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { PageShell } from "@/components/site/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, ShoppingBag, MapPin, LogOut, Edit3, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fetchApi } from "@/lib/api";
import { getMyOrders, type OrderDetails } from "@/api/orders";
import { formatINR } from "@/lib/format";

function CustomerProfileContent() {
  const { user, loading, refresh, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [loading, user, navigate]);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const [orders, setOrders] = useState<OrderDetails[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    label: "Home",
    fullName: "",
    phone: "",
    line1: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setPhone(user.phone ?? "");
      
      setOrdersLoading(true);
      getMyOrders()
        .then(setOrders)
        .catch(() => toast.error("Failed to load orders"))
        .finally(() => setOrdersLoading(false));
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

  const handleAddAddress = async () => {
    if (!newAddress.line1 || !newAddress.city || !newAddress.state || !newAddress.pincode) {
      toast.error("Please fill all address fields");
      return;
    }
    setSaving(true);
    try {
      const currentAddresses = user?.addresses || [];
      const updatedAddresses = [...currentAddresses, newAddress];
      await fetchApi("/auth/me", {
        method: "PUT",
        body: JSON.stringify({ addresses: updatedAddresses }),
      });
      toast.success("Address added successfully");
      refresh();
      setAddingAddress(false);
      setNewAddress({
        label: "Home",
        fullName: "",
        phone: "",
        line1: "",
        city: "",
        state: "",
        pincode: "",
      });
    } catch {
      toast.error("Failed to add address");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container-page py-12">
      <div className="mb-8 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h1 className="font-display text-2xl">{user.name || "Customer"}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <Badge variant="outline" className="mt-1 text-xs capitalize">
              {user.role}
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-2 text-muted-foreground"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </Button>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info" className="gap-2">
            <User className="h-4 w-4" /> My Info
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <ShoppingBag className="h-4 w-4" /> Orders
          </TabsTrigger>
          <TabsTrigger value="addresses" className="gap-2">
            <MapPin className="h-4 w-4" /> Addresses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your name and phone number</CardDescription>
              </div>
              {!editing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setName(user.name ?? "");
                    setPhone(user.phone ?? "");
                    setEditing(true);
                  }}
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
                    <p className="rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm">
                      {user.name || "─"}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <p className="rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm text-muted-foreground">
                    {user.email}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  {editing ? (
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                  ) : (
                    <p className="rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm">
                      {user.phone || "─"}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Email Verified</Label>
                  <p className="rounded-md border border-border bg-secondary/30 px-3 py-2 text-sm">
                    {user.emailVerified ? "✅ Verified" : "❌ Not verified"}
                  </p>
                </div>
              </div>
              {editing && (
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save changes"}
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>My Orders</CardTitle>
              <CardDescription>Your purchase history</CardDescription>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                 <div className="flex items-center justify-center py-12">
                   <div className="h-6 w-6 animate-spin rounded-full border-2 border-foreground border-t-transparent" />
                 </div>
              ) : orders.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
                  <ShoppingBag className="h-12 w-12 opacity-30" />
                  <p className="text-sm">No orders yet</p>
                  <Link to="/shop">
                    <Button variant="outline" size="sm">
                      Start shopping
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={order._id} className="rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                        <div>
                          <p className="font-medium">Order #{order.orderNumber}</p>
                          <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                        <Badge variant={order.status === "delivered" ? "default" : "secondary"} className="capitalize">
                          {order.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
                            <span>{formatINR(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                                              <div className="mt-3 pt-3 border-t border-border flex justify-between font-medium">
                          <span>Total</span>
                          <span>{formatINR(order.total)}</span>
                        </div>

                        {(order.trackingNumber || order.courier || (order.timeline && order.timeline.length > 0)) && (
                          <div className="mt-4 pt-3 border-t border-dashed border-border bg-muted/30 -mx-4 -mb-4 p-4 rounded-b-lg text-sm">
                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                              <MapPin className="h-4 w-4" /> Tracking & Updates
                            </h4>
                            {order.courier && (
                              <p className="text-muted-foreground mb-1">
                                <span className="font-medium text-foreground">Courier:</span> {order.courier}
                              </p>
                            )}
                            {order.trackingNumber && (
                              <p className="text-muted-foreground mb-3">
                                <span className="font-medium text-foreground">Tracking ID:</span> {order.trackingNumber}
                              </p>
                            )}
                            
                            {order.timeline && order.timeline.length > 0 && (
                              <div className="space-y-3 mt-3 pt-3 border-t border-border/50">
                                {order.timeline.slice().reverse().map((event, i) => (
                                  <div key={i} className="flex gap-3">
                                    <div className="mt-0.5 flex flex-col items-center">
                                      <div className="h-2 w-2 rounded-full bg-primary" />
                                      {i !== order.timeline!.length - 1 && <div className="h-full w-px bg-border my-1" />}
                                    </div>
                                    <div>
                                      <p className="font-medium capitalize leading-none mb-1">{event.status.replace("_", " ")}</p>
                                      {event.note && <p className="text-xs text-muted-foreground mb-1">{event.note}</p>}
                                      <p className="text-[10px] text-muted-foreground">{new Date(event.at).toLocaleString()}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addresses" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Saved Addresses</CardTitle>
                <CardDescription>Delivery addresses for quick checkout</CardDescription>
              </div>
              {!addingAddress && (
                <Button variant="outline" size="sm" onClick={() => setAddingAddress(true)} className="gap-2">
                  <Plus className="h-4 w-4" /> Add Address
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {addingAddress && (
                <div className="mb-6 rounded-lg border border-border p-4 bg-secondary/10 space-y-4">
                  <h3 className="font-medium">Add New Address</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Label (e.g. Home, Work)</Label>
                      <Input value={newAddress.label} onChange={(e) => setNewAddress({...newAddress, label: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Full Name</Label>
                      <Input value={newAddress.fullName} onChange={(e) => setNewAddress({...newAddress, fullName: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={newAddress.phone} onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Address Line 1</Label>
                      <Textarea value={newAddress.line1} onChange={(e) => setNewAddress({...newAddress, line1: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input value={newAddress.city} onChange={(e) => setNewAddress({...newAddress, city: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>State</Label>
                      <Input value={newAddress.state} onChange={(e) => setNewAddress({...newAddress, state: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>PIN Code</Label>
                      <Input value={newAddress.pincode} onChange={(e) => setNewAddress({...newAddress, pincode: e.target.value})} />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button onClick={handleAddAddress} disabled={saving}>
                      {saving ? "Saving..." : "Save Address"}
                    </Button>
                    <Button variant="outline" onClick={() => setAddingAddress(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {!user.addresses || user.addresses.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-12 text-center text-muted-foreground">
                  <MapPin className="h-12 w-12 opacity-30" />
                  <p className="text-sm">No addresses saved</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(user.addresses as any).map((addr: any, i: number) => (
                    <div key={i} className="rounded-lg border border-border p-4 text-sm">
                      <p className="font-medium">{addr.label} {addr.fullName ? `- ${addr.fullName}` : ""}</p>
                      <p className="text-muted-foreground">
                        {addr.line1}, {addr.city}, {addr.state} {addr.pincode}
                      </p>
                      {addr.phone && <p className="text-muted-foreground mt-1">Phone: {addr.phone}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <PageShell>
      <CustomerProfileContent />
    </PageShell>
  );
}


