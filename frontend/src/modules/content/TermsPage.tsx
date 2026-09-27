import { useState, useEffect } from "react";
import { PageHeader, PageShell, Prose } from "@/components/site/Layout";

import { loadContent, type SiteContent } from "@/store/content";
import { getSiteContent } from "@/api/content";

export default function TermsPage() {
  const [siteContent, setSiteContent] = useState<SiteContent>(loadContent());

  useEffect(() => {
    getSiteContent().then((data) => {
      if (data) setSiteContent(data);
    });
  }, []);

  const policies = siteContent.policies;

  return (
    <PageShell>
      <PageHeader eyebrow="Legal" title="Terms & conditions" intro="The simple rules that keep things fair for both of us." />
      <Prose>
        <div className="whitespace-pre-line text-muted-foreground">{policies.terms}</div>
      </Prose>
    </PageShell>
  );
}
