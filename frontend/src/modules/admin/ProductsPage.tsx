import { useState, useEffect, useRef } from "react";
import { type Category, type Product } from "@/data/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, MoreHorizontal, Plus, Trash, Image as ImageIcon, Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { getSellerProducts, createProduct as apiCreateProduct, updateProduct as apiUpdateProduct, deleteProduct as apiDeleteProduct, toggleProductBadges as apiToggleBadges } from "@/api/product";
import { getSellerCategories } from "@/api/category";
import { uploadImage } from "@/api/upload";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryList, setCategoryList] = useState<Category[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchProducts = async () => {
    try {
      const res = await getSellerProducts();
      if (res && res.products) {
        setProducts(res.products);
      }
    } catch {
      // quiet fallback
    }
  };

  const fetchCategories = async () => {
    const cats = await getSellerCategories();
    if (cats && cats.length > 0) {
      setCategoryList(cats);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const saveProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
    localStorage.setItem("admin.products", JSON.stringify(newProducts));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const rows = text.split("\n").map((r) => r.split(","));
      if (rows.length < 2) {
        toast.error("Invalid CSV format");
        return;
      }
      
      const headers = rows[0].map((h) => h.trim().toLowerCase());
      const newProducts: Product[] = [];
      
      for (let i = 1; i < rows.length; i++) {
        if (!rows[i].some((c) => c.trim())) continue;
        
        const p: Record<string, string> = {};
        rows[i].forEach((col, index) => {
          const h = headers[index];
          if (h) p[h] = col.trim();
        });
        
        if (p.name && p.price && p.category) {
          try {
            const created = await apiCreateProduct({
              name: p.name,
              price: Number(p.price),
              category: p.category,
              shortDescription: p.shortdescription || "",
              description: p.description || "",
              stock: Number(p.stock || 0),
              images: p.images ? p.images.split(";") : [],
            });
            newProducts.push(created);
          } catch (err) {
            console.error(err);
          }
        }
      }
      if (newProducts.length > 0) {
        fetchProducts();
        toast.success(`${newProducts.length} products imported`);
      } else {
        toast.error("No valid products found in CSV");
      }
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const handleToggleBadge = async (productId: string, badge: "newArrival" | "bestseller") => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;
    try {
      const updatedBadgeState = { [badge]: !target[badge] };
      await apiToggleBadges(productId, updatedBadgeState);
      const updated = products.map((p) =>
        p.id === productId ? { ...p, [badge]: !p[badge] } : p
      );
      saveProducts(updated);
      toast.success(`Product ${badge} updated`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update badge");
    }
  };

  const handleDelete = async (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await apiDeleteProduct(productId);
        const updated = products.filter((p) => p.id !== productId);
        saveProducts(updated);
        toast.success("Product deleted");
      } catch (err: any) {
        toast.error(err.message || "Failed to delete product");
      }
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsSheetOpen(true);
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setIsSheetOpen(true);
  };


  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Bulk Upload CSV
          </Button>
          <input
            type="file"
            accept=".csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <Button onClick={handleAddNew}>
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Badges</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  {product.featuredImage ? (
                    <img src={product.featuredImage} alt={product.name} className="h-10 w-10 rounded-md object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>
                  {categoryList.find((c) => c.slug === product.category || c._id === product.category)?.name || product.category}
                </TableCell>
                <TableCell>₹{product.price}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{product.stock}</span>
                    {product.stock === 0 ? (
                      <Badge variant="destructive">Out of Stock</Badge>
                    ) : product.stock <= 5 ? (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-600 bg-yellow-50">Low Stock</Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">In Stock</Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="space-x-2">
                  <Badge
                    variant={product.newArrival ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => handleToggleBadge(product.id, "newArrival")}
                  >
                    New
                  </Badge>
                  <Badge
                    variant={product.bestseller ? "default" : "secondary"}
                    className="cursor-pointer"
                    onClick={() => handleToggleBadge(product.id, "bestseller")}
                  >
                    Best Seller
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(product)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(product.id)} className="text-destructive">
                        <Trash className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ProductFormSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        product={editingProduct}
        categories={categoryList}
        onSave={async (savedProduct) => {
          try {
            if (editingProduct && editingProduct.id) {
              const updated = await apiUpdateProduct(editingProduct.id, savedProduct);
              saveProducts(products.map((p) => (p.id === editingProduct.id ? updated : p)));
              toast.success("Product updated");
            } else {
              const created = await apiCreateProduct(savedProduct);
              saveProducts([created, ...products]);
              toast.success("Product created");
            }
            setIsSheetOpen(false);
          } catch (err: any) {
            toast.error(err.message || "Failed to save product");
          }
        }}
      />

    </div>
  );
}

function ProductFormSheet({
  open,
  onOpenChange,
  product,
  categories = [],
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  categories: Category[];
  onSave: (product: Product) => void;
}) {
  const [formData, setFormData] = useState<Partial<Product>>({});
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({ ...product });
    } else {
      setFormData({
        name: "",
        shortDescription: "",
        description: "",
        price: undefined,
        compareAtPrice: undefined,
        shippingCost: undefined,
        category: "",
        sku: "",
        stock: undefined,
        images: [],
        featuredImage: "",
        colors: [],
        sizes: [],
        materials: "",
        careInstructions: "",
        estimatedDelivery: "7-10 days",
        customizable: false,
        tags: [],
        featured: false,
        bestseller: false,
        newArrival: false,
        isActive: true,
      });
    }
  }, [product, open]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploadingImage(true);
    try {
      const files = Array.from(e.target.files);
      const uploadedUrls: string[] = [];
      
      for (const file of files) {
        const url = await uploadImage(file);
        if (url) uploadedUrls.push(url);
      }
      
      if (uploadedUrls.length > 0) {
        setFormData(prev => ({
          ...prev,
          images: [...(prev.images || []), ...uploadedUrls],
          featuredImage: prev.featuredImage || uploadedUrls[0]
        }));
        toast.success(`Successfully uploaded ${uploadedUrls.length} image(s)`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      toast.error("Failed to upload images");
    } finally {
      setUploadingImage(false);
      if (e.target) e.target.value = '';
    }
  };

  const removeImage = (indexToRemove: number) => {
    setFormData(prev => {
      const currentImages = prev.images || [];
      const updatedImages = currentImages.filter((_, idx) => idx !== indexToRemove);
      
      return {
        ...prev,
        images: updatedImages,
        featuredImage: updatedImages[0] || "",
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.category) {
      toast.error("Please fill in required fields");
      return;
    }

    const newProduct: Product = {
      id: product?.id || Date.now().toString(),
      sku: formData.sku || product?.sku || `AHC-${Date.now()}`,
      slug: product?.slug || formData.name!.toLowerCase().replace(/ /g, "-"),
      name: formData.name!,
      shortDescription: formData.shortDescription || "",
      description: formData.description || "",
      price: Number(formData.price),
      compareAtPrice: formData.compareAtPrice ? Number(formData.compareAtPrice) : undefined,
      shippingCost: formData.shippingCost ? Number(formData.shippingCost) : 0,
      category: formData.category!,
      stock: Number(formData.stock || 0),
      images: formData.images || [],
      featuredImage: formData.featuredImage || formData.images?.[0] || "",
      colors: typeof formData.colors === 'string' ? (formData.colors as string).split(',').map((s:string)=>s.trim()).filter(Boolean) : (formData.colors || []),
      sizes: typeof formData.sizes === 'string' ? (formData.sizes as string).split(',').map((s:string)=>s.trim()).filter(Boolean) : (formData.sizes || []),
      materials: formData.materials || "",
      careInstructions: formData.careInstructions || "",
      estimatedDelivery: formData.estimatedDelivery || "",
      customizable: formData.customizable || false,
      tags: typeof formData.tags === 'string' ? (formData.tags as string).split(',').map((s:string)=>s.trim()).filter(Boolean) : (formData.tags || []),
      featured: formData.featured || false,
      bestseller: formData.bestseller || false,
      newArrival: formData.newArrival || false,
      isActive: formData.isActive !== false,
      rating: product?.rating || 0,
      reviewCount: product?.reviewCount || 0,
      createdAt: product?.createdAt || new Date().toISOString(),
    };

    onSave(newProduct);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{product ? "Edit Product" : "Add Product"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={formData.sku || ""}
                placeholder="AHC-12345"
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shortDescription">Short Description</Label>
            <Input
              id="shortDescription"
              value={formData.shortDescription || ""}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                value={formData.price || ""}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="compareAtPrice">Discount Price (₹)</Label>
              <Input
                id="compareAtPrice"
                type="number"
                min="0"
                value={formData.compareAtPrice || ""}
                onChange={(e) => setFormData({ ...formData, compareAtPrice: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shippingCost">Shipping Cost (₹)</Label>
            <Input
              id="shippingCost"
              type="number"
              min="0"
              value={formData.shippingCost === undefined ? "" : formData.shippingCost}
              onChange={(e) => setFormData({ ...formData, shippingCost: Number(e.target.value) })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(val) => setFormData({ ...formData, category: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock Quantity *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock === undefined ? "" : formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="colors">Colors (comma separated)</Label>
              <Input
                id="colors"
                value={typeof formData.colors === "object" ? formData.colors?.join(", ") : formData.colors || ""}
                onChange={(e) => setFormData({ ...formData, colors: e.target.value as any })}
                placeholder="Red, Blue, Green"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sizes">Sizes (comma separated)</Label>
              <Input
                id="sizes"
                value={typeof formData.sizes === "object" ? formData.sizes?.join(", ") : formData.sizes || ""}
                onChange={(e) => setFormData({ ...formData, sizes: e.target.value as any })}
                placeholder="S, M, L, XL"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="materials">Materials</Label>
              <Input
                id="materials"
                value={formData.materials || ""}
                onChange={(e) => setFormData({ ...formData, materials: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedDelivery">Estimated Delivery</Label>
              <Input
                id="estimatedDelivery"
                value={formData.estimatedDelivery || ""}
                onChange={(e) => setFormData({ ...formData, estimatedDelivery: e.target.value })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="careInstructions">Care Instructions</Label>
            <Input
              id="careInstructions"
              value={formData.careInstructions || ""}
              onChange={(e) => setFormData({ ...formData, careInstructions: e.target.value })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input
              id="tags"
              value={typeof formData.tags === "object" ? formData.tags?.join(", ") : formData.tags || ""}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value as any })}
              placeholder="crochet, handmade, gift"
            />
          </div>

          <div className="space-y-3">
            <Label>Product Images</Label>
            <div className="flex items-center gap-3">
              <Input
                type="file"
                accept=".jpg,.jpeg,image/jpeg,.png,.webp"
                multiple
                onChange={handleImageUpload}
                disabled={uploadingImage}
              />
              {uploadingImage && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
            </div>
            <p className="text-xs text-muted-foreground">Choose image file(s) to upload directly to cloud / drive storage</p>

            {formData.images && formData.images.length > 0 && (
              <div className="grid grid-cols-4 gap-3 pt-2">
                {formData.images.map((url, idx) => (
                  <div key={idx} className="relative aspect-square border rounded-lg overflow-hidden group">
                    <img src={url} alt={`Product image ${idx + 1}`} className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 rounded-full shadow-md"
                      onClick={() => removeImage(idx)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded">
                        Main
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-2">
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive !== false}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="newArrival"
                checked={formData.newArrival || false}
                onCheckedChange={(checked) => setFormData({ ...formData, newArrival: checked })}
              />
              <Label htmlFor="newArrival">New Arrival</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="bestseller"
                checked={formData.bestseller || false}
                onCheckedChange={(checked) => setFormData({ ...formData, bestseller: checked })}
              />
              <Label htmlFor="bestseller">Best Seller</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="featured"
                checked={formData.featured || false}
                onCheckedChange={(checked) => setFormData({ ...formData, featured: checked })}
              />
              <Label htmlFor="featured">Featured</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="customizable"
                checked={formData.customizable || false}
                onCheckedChange={(checked) => setFormData({ ...formData, customizable: checked })}
              />
              <Label htmlFor="customizable">Customizable</Label>
            </div>
          </div>

          <div className="flex justify-end pt-6">
            <Button type="button" variant="outline" className="mr-2" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save Product</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
