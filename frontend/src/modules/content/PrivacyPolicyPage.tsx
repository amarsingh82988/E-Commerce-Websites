import { useState, useEffect } from "react";
import { PageHeader, PageShell, Prose } from "@/components/site/Layout";

import { loadContent, type SiteContent } from "@/store/content";
import { getSiteContent } from "@/api/content";

export default function PrivacyPolicyPage() {
  const [siteContent, setSiteContent] = useState<SiteContent>(loadContent());

  useEffect(() => {
    getSiteContent().then((data) => {
      if (data) setSiteContent(data);
    });
  }, []);

  const policies = siteContent.policies;

  return (
    <PageShell>
      <PageHeader eyebrow="Legal" title="Privacy policy" intro="Your details stay with us and only where they are needed." />
      <Prose>
        <div className="whitespace-pre-line text-muted-foreground">{policies.privacy}</div>
      </Prose>
    </PageShell>
  );
}
