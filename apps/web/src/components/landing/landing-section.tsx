"use client";

import { cn } from "@loadwhiz/ui/lib/utils";
import type { ReactNode } from "react";

import { LandingReveal } from "@/components/landing/landing-motion";

type LandingSectionProps = {
  id: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  align?: "start" | "center";
  eyebrow?: string;
  eyebrowTone?: "violet" | "sky" | "emerald" | "amber" | "brand";
};

const eyebrowToneClass = {
  brand: "border-primary/25 bg-primary/10 text-primary",
  violet: "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  sky: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  emerald:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  amber:
    "border-amber-500/25 bg-amber-500/10 text-amber-800 dark:text-amber-300",
} as const;

export function LandingSection({
  id,
  title,
  description,
  children,
  className,
  containerClassName,
  align = "start",
  eyebrow,
  eyebrowTone = "brand",
}: LandingSectionProps) {
  const centered = align === "center";

  return (
    <section
      id={id}
      className={cn("relative scroll-mt-24 py-20 md:py-28", className)}
      aria-labelledby={title ? `${id}-title` : undefined}
    >
      <div
        className={cn(
          "mx-auto w-full max-w-6xl px-4 sm:px-6",
          "flex flex-col gap-12 md:gap-14",
          containerClassName,
        )}
      >
        {title ? (
          <LandingReveal
            className={cn(
              "flex max-w-3xl flex-col gap-3",
              centered && "mx-auto items-center text-center",
            )}
          >
            {eyebrow ? (
              <span
                className={cn(
                  "inline-flex w-fit items-center rounded-full border px-3 py-0.5 font-medium text-xs uppercase tracking-wide",
                  eyebrowToneClass[eyebrowTone],
                )}
              >
                {eyebrow}
              </span>
            ) : null}
            <h2
              id={`${id}-title`}
              className="text-balance font-bold text-3xl tracking-tight md:text-4xl lg:text-5xl"
            >
              {title}
            </h2>
            {description ? (
              <p
                className={cn(
                  "text-pretty text-lg text-muted-foreground leading-relaxed",
                  centered && "max-w-3xl",
                )}
              >
                {description}
              </p>
            ) : null}
          </LandingReveal>
        ) : null}
        <div className="w-full min-w-0">{children}</div>
      </div>
    </section>
  );
}
