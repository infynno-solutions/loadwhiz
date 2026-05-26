"use client";

import { cn } from "@loadwhiz/ui/lib/utils";

type LandingBackgroundProps = {
  className?: string;
  variant?: "hero" | "section";
};

export function LandingBackground({
  className,
  variant = "hero",
}: LandingBackgroundProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      <div
        className={cn(
          "absolute inset-0 mask-b-from-50%",
          variant === "hero" ? "opacity-100" : "opacity-60",
        )}
      >
        <div
          className="absolute inset-0 h-full w-full"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(0,0,0,0.04) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(0,0,0,0.04) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />
        <div
          className="absolute inset-0 hidden h-full w-full dark:block"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)
            `,
            backgroundSize: "48px 48px",
          }}
        />
      </div>
      <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-neutral-200 to-transparent dark:via-neutral-800" />
    </div>
  );
}
