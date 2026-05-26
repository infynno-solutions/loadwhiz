import type { ReactNode } from "react";

import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHashScroll } from "@/components/landing/landing-hash-scroll";
import { LandingHeader } from "@/components/landing/landing-header";

type LandingLayoutProps = {
  children: ReactNode;
};

export function LandingLayout({ children }: LandingLayoutProps) {
  return (
    <div
      id="top"
      className="flex min-h-svh flex-col bg-white text-foreground antialiased dark:bg-neutral-950"
    >
      <LandingHashScroll />
      <LandingHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <LandingFooter />
    </div>
  );
}
