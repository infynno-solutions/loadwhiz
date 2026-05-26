"use client";

import { cn } from "@loadwhiz/ui/lib/utils";
import {
  type HTMLMotionProps,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import type { ReactNode } from "react";

export const landingEase = [0.22, 1, 0.36, 1] as const;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1 },
};

const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

type LandingRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: "fadeUp" | "fadeIn" | "scaleIn";
} & Omit<HTMLMotionProps<"div">, "children">;

export function LandingReveal({
  children,
  className,
  delay = 0,
  variant = "fadeUp",
  ...props
}: LandingRevealProps) {
  const reduced = useReducedMotion();
  const variants =
    variant === "fadeIn" ? fadeIn : variant === "scaleIn" ? scaleIn : fadeUp;

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-72px" }}
      variants={variants}
      transition={{ duration: 0.55, delay, ease: landingEase }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type LandingStaggerProps = {
  children: ReactNode;
  className?: string;
  stagger?: number;
};

export function LandingStagger({
  children,
  className,
  stagger = 0.09,
}: LandingStaggerProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-72px" }}
      variants={{
        ...staggerContainer,
        visible: {
          transition: { staggerChildren: stagger, delayChildren: 0.04 },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function LandingStaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div variants={fadeUp} className={className}>
      {children}
    </motion.div>
  );
}

type LandingGlowCardProps = {
  children: ReactNode;
  className?: string;
};

export function LandingGlowCard({ children, className }: LandingGlowCardProps) {
  return (
    <div className={cn("group relative", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px rounded-[calc(var(--radius)+2px)] bg-linear-to-br from-violet-500/20 via-primary/15 to-sky-500/20 opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100"
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

export function LandingFloat({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      animate={{ y: [0, -10, 0] }}
      transition={{
        duration: 6,
        repeat: Number.POSITIVE_INFINITY,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}
