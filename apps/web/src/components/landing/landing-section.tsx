"use client";

import { cn } from "@loadwhiz/ui/lib/utils";
import type { ReactNode } from "react";

import { LandingReveal } from "@/components/landing/landing-motion";
import {
  landingBody,
  landingContainer,
  landingEyebrow,
  landingHeadingSection,
} from "@/components/landing/landing-styles";

type LandingSectionProps = {
  id: string;
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  align?: "start" | "center";
  eyebrow?: string;
};

export function LandingSection({
  id,
  title,
  description,
  children,
  className,
  containerClassName,
  align = "start",
  eyebrow,
}: LandingSectionProps) {
  const centered = align === "center";

  return (
    <section
      id={id}
      className={cn("relative scroll-mt-24 py-16 md:py-28", className)}
      aria-labelledby={title ? `${id}-title` : undefined}
    >
      <div
        className={cn(
          landingContainer,
          "flex flex-col gap-10 md:gap-14",
          containerClassName,
        )}
      >
        {title ? (
          <LandingReveal
            className={cn(
              "flex max-w-3xl flex-col gap-4",
              centered && "mx-auto items-center text-center",
            )}
          >
            {eyebrow ? (
              <span className={cn(landingEyebrow, "cursor-default")}>
                {eyebrow}
              </span>
            ) : null}
            <h2 id={`${id}-title`} className={landingHeadingSection}>
              {title}
            </h2>
            {description ? (
              <p
                className={cn(landingBody, "max-w-2xl", centered && "mx-auto")}
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
