"use client";

import { AppHeader } from "@/components/layout/app-header";
import { EmailVerificationBanner } from "@/components/layout/email-verification-banner";

export function AppTopBar() {
  return (
    <div className="sticky top-0 z-20 shrink-0 bg-background">
      <AppHeader />
      <EmailVerificationBanner />
    </div>
  );
}
