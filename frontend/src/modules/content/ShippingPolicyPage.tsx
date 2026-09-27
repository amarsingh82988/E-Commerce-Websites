import { useState, useEffect } from "react";
import { PageHeader, PageShell, Prose } from "@/components/site/Layout";

import { loadContent, type SiteContent } from "@/store/content";
import { getSiteContent } from "@/api/content";

export default function ShippingPolicyPage() {
  const [siteContent, setSiteContent] = useState<SiteContent>(loadContent());

  useEffect(() => {
    getSiteContent().then((data) => {
      if (data) setSiteContent(data);
    });
  }, []);

  const policies = siteContent.policies;

  return (
    <PageShell>
      <PageHeader eyebrow="Shipping" title="Shipping policy" intro="How and when your handmade parcel reaches you." />
      <Prose>
        <div className="whitespace-pre-line text-muted-foreground">{policies.shipping}</div>
      </Prose>
    </PageShell>
  );
}
