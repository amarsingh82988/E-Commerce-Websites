import { useState, useEffect } from "react";
import { PageHeader, PageShell, Prose } from "@/components/site/Layout";

import { loadContent, type SiteContent } from "@/store/content";
import { getSiteContent } from "@/api/content";

export default function ReturnPolicyPage() {
  const [siteContent, setSiteContent] = useState<SiteContent>(loadContent());

  useEffect(() => {
    getSiteContent().then((data) => {
      if (data) setSiteContent(data);
    });
  }, []);

  const policies = siteContent.policies;

  return (
    <PageShell>
      <PageHeader
        eyebrow="Returns"
        title="Returns & refunds"
        intro="We want you to love your piece. If something is not right, here is what happens next."
      />
      <Prose>
        <div className="whitespace-pre-line text-muted-foreground">{policies.returnPolicy}</div>
      </Prose>
    </PageShell>
  );
}
