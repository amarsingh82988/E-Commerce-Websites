import { useState, useEffect, useRef } from "react";
import { type Category } from "@/data/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, MoreHorizontal, Plus, Trash, GripVertical, Loader2, X, ImageIcon } from "lucide-react";

import { toast } from "sonner";

import { getSellerCategories, createCategory as apiCreateCategory, updateCategory as apiUpdateCategory, deleteCategory as apiDeleteCategory } from "@/api/category";
import { uploadImage } from "@/api/upload";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Drag and drop state
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const fetchCategories = async () => {
    try {
      const data = await getSellerCategories();
      if (data) {
        setCategories(data);
      }
    } catch {
      // quiet fallback
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const saveCategories = (newCategories: Category[]) => {
    setCategories(newCategories);
    localStorage.setItem("admin.categories", JSON.stringify(newCategories));
  };

  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnter = (e: React.DragEvent<HTMLTableRowElement>, index: number) => {
    e.preventDefault();
    dragOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      const copyCategories = [...categories];
      const dragItemContent = copyCategories[dragItem.current];
      copyCategories.splice(dragItem.current, 1);
      copyCategories.splice(dragOverItem.current, 0, dragItemContent);
      saveCategories(copyCategories);
      toast.success("Categories reordered");
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleDelete = async (category: Category) => {
    if (confirm("Are you sure you want to delete this category?")) {
      try {
        if (category._id) {
          await apiDeleteCategory(category._id);
        }
        const updated = categories.filter((c) => c.slug !== category.slug && c._id !== category._id);
        saveCategories(updated);
        toast.success("Category deleted");
      } catch (err: any) {
        toast.error(err.message || "Failed to delete category");
      }
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsSheetOpen(true);
  };

  const handleAddNew = () => {
    setEditingCategory(null);
    setIsSheetOpen(true);
  };


  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <Button onClick={handleAddNew}>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10"></TableHead>
              <TableHead className="w-14">Image</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category, index) => (
              <TableRow
                key={category.slug}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className="cursor-move"
              >
                <TableCell>
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </TableCell>
                <TableCell>
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="h-10 w-10 rounded-md object-cover border"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center border text-muted-foreground">
                      <ImageIcon className="h-4 w-4" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{category.name}</TableCell>

                <TableCell className="max-w-xs truncate text-muted-foreground">
                  {category.description}
                </TableCell>
                <TableCell>{category.slug}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(category)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(category)} className="text-destructive">
                        <Trash className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>

                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                  No categories found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <CategoryFormSheet
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        category={editingCategory}
        onSave={async (savedCategory) => {
          try {
            if (editingCategory && editingCategory._id) {
              const updated = await apiUpdateCategory(editingCategory._id, savedCategory);
              saveCategories(categories.map((c) => (c.slug === editingCategory.slug || c._id === editingCategory._id ? updated : c)));
              toast.success("Category updated");
            } else {
              const created = await apiCreateCategory(savedCategory);
              saveCategories([...categories, created]);
              toast.success("Category created");
            }
            setIsSheetOpen(false);
          } catch (err: any) {
            toast.error(err.message || "Failed to save category");
          }
        }}
      />

    </div>
  );
}

function CategoryFormSheet({
  open,
  onOpenChange,
  category,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: Category | null;
  onSave: (category: Category) => void;
}) {
  const [formData, setFormData] = useState<Partial<Category>>({});
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (open) {
      if (category) {
         
        setFormData(category);
      } else {
        setFormData({
          name: "",
          slug: "",
          description: "",
          image: "",
        });
      }
    }
  }, [open, category]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const url = await uploadImage(file);
      setFormData((prev) => ({ ...prev, image: url }));
      toast.success("Category image uploaded successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload category image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error("Name is required");
      return;
    }

    const slug = formData.slug || formData.name.toLowerCase().replace(/ /g, "-");

    const newCategory: Category = {
      name: formData.name,
      slug: slug,
      description: formData.description || "",
      image: formData.image || "",
    };

    onSave(newCategory);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{category ? "Edit Category" : "Add Category"}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name || ""}
              onChange={(e) => {
                const name = e.target.value;
                setFormData({
                  ...formData,
                  name,
                  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, ""),
                });
              }}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={formData.slug || ""}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Used in URLs (e.g. /category/slug)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Category Image</Label>
            {formData.image ? (
              <div className="relative w-36 h-36 border rounded-lg overflow-hidden group">
                <img src={formData.image} alt="Category preview" className="w-full h-full object-cover" />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-1 right-1 h-7 w-7 rounded-full shadow-md"
                  onClick={() => setFormData({ ...formData, image: "" })}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept=".jpg,.jpeg,image/jpeg"
                  onChange={handleImageUpload}
                  disabled={uploadingImage}
                />
                {uploadingImage && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
              </div>
            )}
            <p className="text-xs text-muted-foreground">Upload category image (stored on Drive / Cloud)</p>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="button" variant="outline" className="mr-2" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploadingImage}>
              Save Category
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

