import { useSearchParams } from "react-router-dom";
import { PageHeader, PageShell } from "@/components/site/Layout";
import { ProductGrid, type ShopSearch } from "@/components/site/ProductGrid";

export default function SearchPage() {
  const [params] = useSearchParams();
  const search: ShopSearch = {
    q: params.get("q") ?? undefined,
  };
  return (
    <PageShell>
      <PageHeader
        eyebrow="Search"
        title={search.q ? `Results for "${search.q}"` : "Search"}
        intro="Looking for something specific? Start typing in the search bar above."
      />
      <ProductGrid search={search} />
    </PageShell>
  );
}
