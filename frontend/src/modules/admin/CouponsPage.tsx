import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { Tag, Plus, Trash2, Check, X, Loader2, Layers, Package } from "lucide-react";
import { getAllCoupons, createCoupon, updateCoupon, deleteCoupon, type CouponItem } from "@/api/coupons";
import { getPublicCategories } from "@/api/category";
import { getPublicProducts } from "@/api/product";
import { formatINR } from "@/lib/format";
import { type Category, type Product } from "@/data/catalog";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [openSheet, setOpenSheet] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    code: "",
    description: "",
    type: "percent" as "percent" | "flat",
    value: "",
    minOrderValue: "",
    maxDiscount: "",
    usageLimit: "",
    expiresAt: "",
    isActive: true,
    appliesTo: "all" as "all" | "category" | "products",
    categoryId: "",
    selectedProductIds: [] as string[],
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [cData, catData, prodRes] = await Promise.all([
        getAllCoupons(),
        getPublicCategories(),
        getPublicProducts({ limit: 100 }),
      ]);
      setCoupons(cData || []);
      setCategories(catData || []);
      setProductsList(prodRes?.products || []);
    } catch {
      toast.error("Failed to load coupons or store data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) {
      toast.error("Please enter a coupon code.");
      return;
    }
    if (!form.value || Number(form.value) <= 0) {
      toast.error("Please enter a valid discount value.");
      return;
    }
    if (form.appliesTo === "category" && !form.categoryId) {
      toast.error("Please select a target category.");
      return;
    }
    if (form.appliesTo === "products" && form.selectedProductIds.length === 0) {
      toast.error("Please select at least one target product.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await createCoupon({
        code: form.code,
        description: form.description,
        type: form.type,
        value: Number(form.value),
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : 0,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : 0,
        expiresAt: form.expiresAt || undefined,
        isActive: form.isActive,
        appliesTo: form.appliesTo,
        category: form.appliesTo === "category" ? form.categoryId : undefined,
        products: form.appliesTo === "products" ? form.selectedProductIds : undefined,
      } as any);

      toast.success(res.message || "Coupon created successfully!");
      setForm({
        code: "",
        description: "",
        type: "percent",
        value: "",
        minOrderValue: "",
        maxDiscount: "",
        usageLimit: "",
        expiresAt: "",
        isActive: true,
        appliesTo: "all",
        categoryId: "",
        selectedProductIds: [],
      });
      setOpenSheet(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create coupon.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (coupon: CouponItem) => {
    try {
      await updateCoupon(coupon._id, { isActive: !coupon.isActive });
      toast.success(`Coupon "${coupon.code}" is now ${!coupon.isActive ? "Active" : "Inactive"}`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to update coupon status.");
    }
  };

  const handleDeleteCoupon = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete coupon code "${code}"?`)) return;
    try {
      await deleteCoupon(id);
      toast.success(`Coupon "${code}" deleted.`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete coupon.");
    }
  };

  const renderScopeBadge = (coupon: any) => {
    if (coupon.appliesTo === "category") {
      const catName = coupon.category?.name || "Category";
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 text-[0.7rem] flex items-center gap-1">
          <Layers className="h-3 w-3" /> {catName}
        </Badge>
      );
    }
    if (coupon.appliesTo === "products") {
      const count = coupon.products?.length || 0;
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-800 border-purple-200 text-[0.7rem] flex items-center gap-1">
          <Package className="h-3 w-3" /> {count} Selected Products
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-gray-100 text-gray-800 text-[0.7rem]">
        All Products
      </Badge>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seller Coupon Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create storewide, category-specific, or product-specific discount coupons for your store. Validated securely on the server.
          </p>
        </div>
        <Button onClick={() => setOpenSheet(true)}>
          <Plus className="h-4 w-4 mr-2" /> Create New Coupon
        </Button>
      </div>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="border rounded-md bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Min. Order</TableHead>
                <TableHead>Redemptions</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.length > 0 ? (
                coupons.map((c: any) => {
                  const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
                  return (
                    <TableRow key={c._id}>
                      <TableCell className="font-mono font-bold text-accent">
                        <div className="flex items-center gap-1.5">
                          <Tag className="h-3.5 w-3.5" /> {c.code}
                        </div>
                        {c.description && <p className="text-[0.7rem] font-normal text-muted-foreground">{c.description}</p>}
                      </TableCell>
                      <TableCell>{renderScopeBadge(c)}</TableCell>
                      <TableCell className="font-medium">
                        {c.type === "percent" ? `${c.value}% OFF` : `${formatINR(c.value)} OFF`}
                        {c.maxDiscount > 0 && <span className="block text-[0.7rem] text-muted-foreground">Max: {formatINR(c.maxDiscount)}</span>}
                      </TableCell>
                      <TableCell>{c.minOrderValue > 0 ? formatINR(c.minOrderValue) : "No min"}</TableCell>
                      <TableCell className="text-sm">
                        {c.usedCount} {c.usageLimit > 0 ? `/ ${c.usageLimit}` : "uses"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-IN") : "Never"}
                      </TableCell>
                      <TableCell>
                        {isExpired ? (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Expired</Badge>
                        ) : c.isActive ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-700">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleActive(c)}
                          title={c.isActive ? "Deactivate" : "Activate"}
                        >
                          {c.isActive ? <X className="h-4 w-4 text-amber-600" /> : <Check className="h-4 w-4 text-emerald-600" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCoupon(c._id, c.code)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No coupons created yet. Click "Create New Coupon" to add one!
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Sheet to Create Coupon */}
      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-6">
            <SheetTitle>Create Promotional Coupon</SheetTitle>
          </SheetHeader>

          <form onSubmit={handleCreateCoupon} className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1">Coupon Code *</label>
              <Input
                placeholder="e.g. FESTIVE20"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1">Applicability Scope *</label>
              <Select
                value={form.appliesTo}
                onValueChange={(val: "all" | "category" | "products") => setForm((f) => ({ ...f, appliesTo: val }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Whole Store (All Products)</SelectItem>
                  <SelectItem value="category">Category Specific</SelectItem>
                  <SelectItem value="products">Specific Products</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Category Selector */}
            {form.appliesTo === "category" && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1">Target Category *</label>
                <Select
                  value={form.categoryId}
                  onValueChange={(catId) => setForm((f) => ({ ...f, categoryId: catId }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => {
                      const catVal = c._id || (c as any).id || c.slug || "";
                      return (
                        <SelectItem key={catVal} value={catVal}>
                          {c.name}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Product Selector */}
            {form.appliesTo === "products" && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1">Target Products *</label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2 space-y-1.5 bg-muted/20">
                  {productsList.map((p) => {
                    const isChecked = form.selectedProductIds.includes(p.id);
                    return (
                      <label key={p.id} className="flex items-center gap-2 text-xs cursor-pointer p-1 rounded hover:bg-muted">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            setForm((f) => ({
                              ...f,
                              selectedProductIds: checked
                                ? [...f.selectedProductIds, p.id]
                                : f.selectedProductIds.filter((id) => id !== p.id),
                            }));
                          }}
                        />
                        <span className="truncate">{p.name} ({formatINR(p.price)})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1">Description (Optional)</label>
              <Input
                placeholder="e.g. 20% off for festive season"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1">Discount Type *</label>
                <Select
                  value={form.type}
                  onValueChange={(val: "percent" | "flat") => setForm((f) => ({ ...f, type: val }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage (%)</SelectItem>
                    <SelectItem value="flat">Flat Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1">
                  Value ({form.type === "percent" ? "%" : "₹"}) *
                </label>
                <Input
                  type="number"
                  placeholder={form.type === "percent" ? "10" : "150"}
                  value={form.value}
                  onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1">Min Order Value (₹)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.minOrderValue}
                  onChange={(e) => setForm((f) => ({ ...f, minOrderValue: e.target.value }))}
                />
              </div>

              {form.type === "percent" && (
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider block mb-1">Max Discount (₹)</label>
                  <Input
                    type="number"
                    placeholder="e.g. 500 (0 for no cap)"
                    value={form.maxDiscount}
                    onChange={(e) => setForm((f) => ({ ...f, maxDiscount: e.target.value }))}
                  />
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1">Usage Limit</label>
                <Input
                  type="number"
                  placeholder="0 (Unlimited)"
                  value={form.usageLimit}
                  onChange={(e) => setForm((f) => ({ ...f, usageLimit: e.target.value }))}
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider block mb-1">Expiry Date</label>
                <Input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                />
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full mt-6" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save & Activate Coupon"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
