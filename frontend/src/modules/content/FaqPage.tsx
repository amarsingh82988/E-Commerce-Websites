import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PageHeader, PageShell } from "@/components/site/Layout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { loadContent, type SiteContent } from "@/store/content";
import { getSiteContent } from "@/api/content";

export default function FaqPage() {
  const [siteContent, setSiteContent] = useState<SiteContent>(loadContent());

  useEffect(() => {
    getSiteContent().then((data) => {
      if (data) setSiteContent(data);
    });
  }, []);

  const faqs = siteContent.faqs || [];

  return (
    <PageShell>
      <PageHeader
        eyebrow="Good to know"
        title="Frequently asked questions"
        intro="Everything about timelines, shipping, care and custom pieces — in one place."
      />
      <div className="container-page max-w-3xl py-16">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((f, i) => (
            <AccordionItem key={f.id} value={`item-${i}`}>
              <AccordionTrigger className="text-left font-display text-lg">{f.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground whitespace-pre-line">{f.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Still unsure about something?{" "}
          <Link to="/contact" className="text-accent underline underline-offset-4">
            Write to the studio
          </Link>
          .
        </p>
      </div>
    </PageShell>
  );
}
