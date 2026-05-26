"use client";

import { buttonVariants } from "@loadwhiz/ui/components/button";
import { cn } from "@loadwhiz/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { HiArrowRight } from "react-icons/hi2";
import { SiGithub } from "react-icons/si";

import { LandingBackground } from "@/components/landing/landing-background";
import { LandingBrandButton } from "@/components/landing/landing-brand-button";
import { LANDING_GITHUB_URL } from "@/components/landing/landing-constants";
import { LandingReveal } from "@/components/landing/landing-motion";
import {
  landingBody,
  landingContainer,
  landingHeadingSection,
  landingTextMuted,
} from "@/components/landing/landing-styles";

export function LandingCta() {
  return (
    <section className="relative overflow-hidden border-neutral-200 border-t py-20 md:py-28 dark:border-neutral-800">
      <LandingBackground variant="section" />
      <div
        className={cn(
          landingContainer,
          "relative z-10 flex flex-col items-center gap-8 text-center",
        )}
      >
        <LandingReveal
          variant="fadeUp"
          className="flex max-w-3xl flex-col items-center gap-4"
        >
          <h2 className={landingHeadingSection}>
            Start protecting your users from performance surprises
          </h2>
          <p className={landingBody}>
            Get your first load test running in minutes. No infrastructure to
            provision, no complex setup — just clear performance answers before
            every release.
          </p>
        </LandingReveal>

        <LandingReveal
          delay={0.15}
          className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
        >
          <LandingBrandButton
            size="lg"
            className="h-11 gap-2 px-6 text-sm"
            render={<Link to="/signup" />}
          >
            Start testing free
            <HiArrowRight className="size-4" aria-hidden />
          </LandingBrandButton>
          <a
            href={LANDING_GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-11 gap-2 rounded-md border-neutral-300 bg-white px-6 text-sm dark:border-neutral-700 dark:bg-neutral-900",
            )}
          >
            <SiGithub className="size-4" aria-hidden />
            View on GitHub
          </a>
        </LandingReveal>

        <LandingReveal delay={0.25}>
          <p className={cn("text-sm", landingTextMuted)}>
            Free to start · Deploy on your infrastructure · No vendor lock-in
          </p>
        </LandingReveal>
      </div>
    </section>
  );
}
