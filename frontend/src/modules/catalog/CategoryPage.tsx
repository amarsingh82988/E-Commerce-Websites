import { useState, useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { PageHeader, PageShell } from "@/components/site/Layout";
import { ProductGrid } from "@/components/site/ProductGrid";
import { type Category } from "@/data/catalog";
import { getPublicCategories } from "@/api/category";

export default function CategoryPage() {
  const { slug } = useParams();
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicCategories().then((cats) => {
      const found = cats.find((c) => c.slug === slug);
      if (found) {
        setCategory(found);
      }
      setLoading(false);
    });
  }, [slug]);

  if (!category && !loading) {
    return <Navigate to="/categories" replace />;
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="Category"
        title={category?.name || (slug ? slug.replace(/-/g, " ") : "Category")}
        intro={category?.description || "Browse handcrafted collection."}
      />
      <ProductGrid search={{}} lockedCategory={slug || ""} />
    </PageShell>
  );
}
