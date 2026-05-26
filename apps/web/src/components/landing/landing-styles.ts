import { cn } from "@loadwhiz/ui/lib/utils";
import {
  marketingTextBody,
  marketingTextEyebrow,
  marketingTextHeading,
  marketingTextMuted,
  marketingTextNav,
  marketingTextPrimary,
} from "@/lib/marketing-text";

/** Shared layout + typography aligned with Aceternity Simplistic SaaS template */
export const landingContainer = "mx-auto w-full max-w-7xl px-4 md:px-8";

export const landingNavLink = cn(
  "font-medium text-sm transition-colors",
  marketingTextNav,
  "hover:text-neutral-900 dark:hover:text-white",
);

export const landingHeadingHero = cn(
  "text-balance font-medium text-4xl tracking-tight md:text-7xl",
  marketingTextHeading,
);

export const landingHeadingSection = cn(
  "text-balance font-medium text-3xl tracking-tight md:text-5xl",
  marketingTextHeading,
);

export const landingBodyLg = cn(
  "text-pretty text-base md:text-xl",
  marketingTextBody,
);

export const landingBody = cn("text-pretty text-base", marketingTextBody);

export const landingTextMuted = marketingTextMuted;

export const landingTextPrimary = marketingTextPrimary;

export const landingTextHeading = marketingTextHeading;

export const landingEyebrow = cn(
  "inline-flex w-fit items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs transition-colors hover:bg-neutral-50",
  marketingTextEyebrow,
  "dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800",
);

/** Matches Aceternity Simplistic template brand CTA */
export const landingBrandButtonClass = cn(
  "relative inline-flex cursor-pointer items-center justify-center rounded-md border-0 font-medium",
  "bg-linear-to-b from-brand-secondary to-brand-primary text-white",
  "transition-all duration-200 active:scale-[0.98]",
  "[text-shadow:0_1px_2px_rgba(0,0,0,0.2)]",
  "hover:from-brand-secondary hover:to-brand-primary",
  "hover:shadow-[0_1px_2px_rgba(0,0,0,0.1),0_3px_5px_rgba(30,144,255,0.5),inset_0_1px_0_rgba(255,255,255,0.25)]",
);

export const landingCardClass = cn(
  "rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900",
);
