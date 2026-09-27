import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
}) {
  return (
    <div className="relative border-b border-border bg-secondary/30">
      {/* Decorative Glow */}
      <div className="absolute left-0 top-0 h-full w-[300px] bg-primary/5 blur-2xl"></div>

      <div className="container-page relative z-10 py-3 flex items-center gap-3 md:gap-4 overflow-hidden">
        <h1 className="font-display text-xl md:text-2xl font-semibold tracking-tight text-foreground whitespace-nowrap shrink-0">
          {title}
        </h1>
        
        {eyebrow && (
          <div className="hidden sm:inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-primary shrink-0">
            {eyebrow}
          </div>
        )}
        
        {intro && (
          <>
            <div className="h-4 w-px bg-primary/30 shrink-0 hidden sm:block"></div>
            <p className="text-xs md:text-sm text-muted-foreground truncate w-full">
              {intro}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="container-page max-w-3xl py-14 [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_li]:text-muted-foreground [&_p]:mt-3 [&_p]:text-muted-foreground [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
      {children}
    </div>
  );
}
