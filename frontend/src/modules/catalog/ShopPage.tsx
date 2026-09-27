import { useSearchParams } from "react-router-dom";
import { ProductGrid, type ShopSearch } from "@/components/site/ProductGrid";
import { PageHeader, PageShell } from "@/components/site/Layout";

export default function Shop() {
  const [params] = useSearchParams();
  const search: ShopSearch = {
    q: params.get("q") ?? undefined,
    category: params.get("category") ?? undefined,
    sort: params.get("sort") ?? undefined,
    page: params.get("page") ? Number(params.get("page")) : undefined,
  };
  return (
    <PageShell>
      <PageHeader
        eyebrow="The collection"
        title="All Products"
        intro="Crochet pieces made slowly, in small batches, by hand."
      />
      <ProductGrid search={search} />
    </PageShell>
  );
}
