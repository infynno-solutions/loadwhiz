import type { ReactNode } from "react";

import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";

/**
 * Auth shell matches Simplistic template: fixed header, full-viewport centered
 * form (px-4 only), then marketing footer below the fold.
 */
export function AuthPageLayout({ children }: { children: ReactNode }) {
  return (
    <div
      id="top"
      className="bg-white text-foreground antialiased dark:bg-neutral-950"
    >
      <LandingHeader />
      <main
        id="main"
        className="flex min-h-[calc(100svh-3.5rem)] w-full items-center justify-center px-4 sm:min-h-[calc(100svh-4rem)]"
      >
        <div className="w-full max-w-sm">{children}</div>
      </main>
      <LandingFooter />
    </div>
  );
}

export function AuthPageShell({ children }: { children: ReactNode }) {
  return <AuthPageLayout>{children}</AuthPageLayout>;
}
