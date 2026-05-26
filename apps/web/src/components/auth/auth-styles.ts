import { cn } from "@loadwhiz/ui/lib/utils";
import {
  marketingTextInput,
  marketingTextLabel,
  marketingTextMuted,
  marketingTextPlaceholder,
  marketingTextPrimary,
} from "@/lib/marketing-text";

/** Shared shell look (password group wrapper + email field) */
export const authInputShellClass = cn(
  "h-10 w-full rounded-lg border-0 bg-white shadow-input ring-0",
  "outline-none transition-shadow",
  "focus-within:shadow-input focus-within:ring-2 focus-within:ring-neutral-900",
  "dark:bg-neutral-800 dark:shadow-(--shadow-input-dark)",
  "dark:focus-within:ring-neutral-400",
  "has-[[aria-invalid=true]]:shadow-input has-[[aria-invalid=true]]:ring-2",
  "has-[[aria-invalid=true]]:ring-destructive/40",
  "dark:has-[[aria-invalid=true]]:ring-destructive/50",
);

/** Inner control for AuthTextInput (border/shadow live on the shell) */
export const authInputInnerClass = cn(
  "h-10 w-full min-w-0 border-0 bg-transparent px-4 py-2 text-sm shadow-none ring-0",
  "outline-none",
  marketingTextInput,
  marketingTextPlaceholder,
  "focus-visible:border-0 focus-visible:shadow-none focus-visible:ring-0",
  "disabled:cursor-not-allowed disabled:opacity-50",
);

/** InputPassword — template look on the group wrapper */
export const authInputGroupClass = cn(
  authInputShellClass,
  "has-[[data-slot=input-group-control]:focus-visible]:border-0",
  "has-[[data-slot=input-group-control]:focus-visible]:shadow-input",
  "has-[[data-slot=input-group-control]:focus-visible]:ring-2",
  "has-[[data-slot=input-group-control]:focus-visible]:ring-neutral-900",
  "has-[[data-slot][aria-invalid=true]]:ring-2 has-[[data-slot][aria-invalid=true]]:ring-destructive/40",
  "dark:has-[[data-slot=input-group-control]:focus-visible]:ring-neutral-400",
  "dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/50",
  "[&_[data-slot=input-group-control]]:h-10 [&_[data-slot=input-group-control]]:border-0",
  "[&_[data-slot=input-group-control]]:bg-transparent [&_[data-slot=input-group-control]]:px-4",
  "[&_[data-slot=input-group-control]]:py-2 [&_[data-slot=input-group-control]]:text-sm",
  "[&_[data-slot=input-group-control]]:shadow-none [&_[data-slot=input-group-control]]:ring-0",
  "[&_[data-slot=input-group-control]]:border-0",
  "[&_[data-slot=input-group-control]]:bg-transparent",
  cn(
    "[&_[data-slot=input-group-control]]:outline-none",
    "[&_[data-slot=input-group-control]]:text-black dark:[&_[data-slot=input-group-control]]:text-white",
    "[&_[data-slot=input-group-control]]:placeholder:text-neutral-400",
    "dark:[&_[data-slot=input-group-control]]:placeholder:text-neutral-600",
  ),
  "[&_[data-slot=input-group-control]:focus-visible]:border-0",
  "[&_[data-slot=input-group-control]:focus-visible]:shadow-none",
  "[&_[data-slot=input-group-control]:focus-visible]:ring-0",
);

export const authLabelClass = cn(
  "mb-1.5 block font-medium text-sm",
  marketingTextLabel,
);

export const authLinkClass = cn(
  "transition-colors",
  marketingTextMuted,
  "hover:text-neutral-900 dark:hover:text-white",
);

export const authInlineLinkClass = cn(
  authLinkClass,
  "font-medium underline-offset-4 hover:underline",
);

/** Accent link in auth form footers (e.g. “Sign up”, “Sign in”) */
export const authFormFooterLinkClass = cn(
  "font-medium hover:underline",
  marketingTextPrimary,
);

export const authPrimaryButtonClass = "h-auto w-full py-2.5 text-sm";

export const authFormClass = "flex flex-col gap-y-4";

export const authLegalClass = cn(
  "mt-6 text-center text-xs",
  marketingTextMuted,
);

export const authFormFooterClass = cn(
  "mt-6 text-center text-sm",
  marketingTextMuted,
);

export const authFieldDescriptionClass = cn("text-xs", marketingTextMuted);
