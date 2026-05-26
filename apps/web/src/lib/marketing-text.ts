import { cn } from "@loadwhiz/ui/lib/utils";

/**
 * Text colors aligned with Aceternity Simplistic SaaS template
 * (login-signup-minimal, marketing pages).
 */
export const marketingTextPrimary = "text-neutral-900 dark:text-white";

export const marketingTextHeading = "text-neutral-800 dark:text-neutral-200";

export const marketingTextBody = "text-neutral-600 dark:text-neutral-400";

export const marketingTextMuted = "text-neutral-500 dark:text-neutral-400";

export const marketingTextNav = "text-neutral-600 dark:text-neutral-400";

export const marketingTextLabel = "text-neutral-700 dark:text-neutral-300";

export const marketingTextEyebrow = "text-neutral-700 dark:text-neutral-300";

/** Form control value (Aceternity signup-form uses black / white) */
export const marketingTextInput = "text-black dark:text-white";

export const marketingTextPlaceholder =
  "placeholder:text-neutral-400 dark:placeholder:text-neutral-600";

export function marketingTextMutedSm(className?: string) {
  return cn("text-sm", marketingTextMuted, className);
}
