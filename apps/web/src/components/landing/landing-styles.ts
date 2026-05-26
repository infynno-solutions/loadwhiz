import { cn } from "@loadwhiz/ui/lib/utils";

/** Shared layout + typography aligned with Aceternity Simplistic SaaS template */
export const landingContainer = "mx-auto w-full max-w-7xl px-4 md:px-8";

export const landingNavLink =
  "text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white";

export const landingHeadingHero =
  "text-balance font-medium text-4xl tracking-tight text-neutral-700 md:text-7xl dark:text-neutral-300";

export const landingHeadingSection =
  "text-balance font-medium text-3xl tracking-tight text-neutral-800 md:text-5xl dark:text-neutral-200";

export const landingBodyLg =
  "text-pretty text-base text-neutral-600 md:text-xl dark:text-neutral-400";

export const landingBody =
  "text-pretty text-base text-neutral-600 dark:text-neutral-400";

export const landingEyebrow =
  "inline-flex w-fit items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-neutral-700 text-xs transition-colors hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800";

/** Matches Aceternity Simplistic template brand CTA */
export const landingBrandButtonClass = cn(
  "relative inline-flex cursor-pointer items-center justify-center rounded-md border-0 font-medium",
  "from-brand-secondary to-brand-primary bg-linear-to-b text-white",
  "transition-all duration-200 active:scale-[0.98]",
  "[text-shadow:0_1px_2px_rgba(0,0,0,0.2)]",
  "hover:from-brand-secondary hover:to-brand-primary",
  "hover:shadow-[0_1px_2px_rgba(0,0,0,0.1),0_3px_5px_rgba(30,144,255,0.5),inset_0_1px_0_rgba(255,255,255,0.25)]",
);

export const landingCardClass = cn(
  "rounded-2xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900",
);
