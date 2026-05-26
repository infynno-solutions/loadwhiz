import { cn } from "@loadwhiz/ui/lib/utils";
import type { IconType } from "react-icons";

export type LandingIconTone =
  | "brand"
  | "violet"
  | "sky"
  | "emerald"
  | "amber"
  | "rose"
  | "orange"
  | "teal";

const toneClass: Record<LandingIconTone, string> = {
  brand:
    "bg-brand-primary/12 text-brand-primary ring-brand-primary/25 dark:bg-brand-primary/15 dark:text-brand-primary",
  violet:
    "bg-violet-500/12 text-violet-700 ring-violet-500/20 dark:text-violet-300",
  sky: "bg-sky-500/12 text-sky-700 ring-sky-500/20 dark:text-sky-300",
  emerald:
    "bg-emerald-500/12 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
  amber: "bg-amber-500/12 text-amber-800 ring-amber-500/20 dark:text-amber-300",
  rose: "bg-rose-500/12 text-rose-700 ring-rose-500/20 dark:text-rose-300",
  orange:
    "bg-orange-500/12 text-orange-700 ring-orange-500/20 dark:text-orange-300",
  teal: "bg-teal-500/12 text-teal-700 ring-teal-500/20 dark:text-teal-300",
};

type LandingIconProps = {
  icon: IconType;
  tone?: LandingIconTone;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClass = {
  sm: "size-9 rounded-lg [&_svg]:size-4",
  md: "size-11 rounded-xl [&_svg]:size-5",
  lg: "size-14 rounded-2xl [&_svg]:size-7",
} as const;

export function LandingIcon({
  icon: Icon,
  tone = "brand",
  size = "md",
  className,
}: LandingIconProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center ring-1 ring-inset",
        sizeClass[size],
        toneClass[tone],
        className,
      )}
    >
      <Icon aria-hidden />
    </span>
  );
}
