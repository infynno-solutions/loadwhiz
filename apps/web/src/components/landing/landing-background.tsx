"use client";

import { cn } from "@loadwhiz/ui/lib/utils";
import { motion, useReducedMotion } from "framer-motion";

type LandingBackgroundProps = {
  className?: string;
  variant?: "hero" | "section";
};

export function LandingBackground({
  className,
  variant = "hero",
}: LandingBackgroundProps) {
  const reduced = useReducedMotion();

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
          "absolute inset-0 opacity-[0.4] dark:opacity-[0.22]",
          variant === "hero"
            ? "[mask-image:radial-gradient(ellipse_75%_60%_at_50%_0%,#000_50%,transparent_100%)]"
            : "[mask-image:radial-gradient(ellipse_85%_65%_at_50%_50%,#000_35%,transparent_100%)]",
        )}
        style={{
          backgroundImage: `
            linear-gradient(to right, color-mix(in oklch, var(--border) 50%, transparent) 1px, transparent 1px),
            linear-gradient(to bottom, color-mix(in oklch, var(--border) 50%, transparent) 1px, transparent 1px)
          `,
          backgroundSize: variant === "hero" ? "3rem 3rem" : "3.5rem 3.5rem",
        }}
      />
      <div className="absolute top-0 left-1/2 size-[min(110%,44rem)] -translate-x-1/2 rounded-full bg-primary/18 blur-3xl dark:bg-primary/12" />
      <div className="absolute top-1/4 -right-20 size-80 rounded-full bg-violet-500/15 blur-3xl" />
      <div className="absolute top-1/3 -left-28 size-72 rounded-full bg-sky-500/12 blur-3xl" />
      <div className="absolute right-1/4 -bottom-20 size-96 rounded-full bg-emerald-500/10 blur-3xl" />
      {variant === "hero" ? (
        <div className="absolute right-[8%] bottom-[20%] size-56 rounded-full bg-amber-500/8 blur-3xl" />
      ) : null}
      {!reduced ? (
        <motion.div
          className="absolute top-[20%] left-[10%] size-2 rounded-full bg-violet-500/50"
          animate={{ opacity: [0.25, 0.85, 0.25], scale: [1, 1.25, 1] }}
          transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY }}
        />
      ) : null}
      {!reduced ? (
        <motion.div
          className="absolute top-[38%] right-[14%] size-1.5 rounded-full bg-emerald-500/60"
          animate={{ opacity: [0.2, 0.75, 0.2], y: [0, -8, 0] }}
          transition={{
            duration: 5,
            repeat: Number.POSITIVE_INFINITY,
            delay: 1,
          }}
        />
      ) : null}
    </div>
  );
}
