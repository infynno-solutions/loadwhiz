"use client";

import { Button } from "@loadwhiz/ui/components/button";
import { Link } from "@tanstack/react-router";
import { HiArrowRight } from "react-icons/hi2";
import { SiGithub } from "react-icons/si";
import { LandingBackground } from "@/components/landing/landing-background";
import { LANDING_GITHUB_URL } from "@/components/landing/landing-constants";
import { LandingReveal } from "@/components/landing/landing-motion";

export function LandingCta() {
  return (
    <section className="relative overflow-hidden border-t bg-linear-to-br from-primary/8 via-background to-violet-500/8 py-24 md:py-32">
      <LandingBackground variant="section" className="opacity-50" />
      <div className="relative mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-4 text-center sm:px-6">
        <LandingReveal
          variant="fadeUp"
          className="flex flex-col items-center gap-4"
        >
          <h2 className="text-balance font-bold text-3xl tracking-tight md:text-4xl lg:text-5xl">
            Start protecting your users from performance surprises
          </h2>
          <p className="max-w-2xl text-pretty text-lg text-muted-foreground leading-relaxed">
            Get your first load test running in minutes. No infrastructure to
            provision, no complex setup — just clear performance answers before
            every release.
          </p>
        </LandingReveal>

        <LandingReveal
          delay={0.15}
          className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center"
        >
          <Button
            size="lg"
            className="h-12 gap-2 px-8 text-base"
            render={<Link to="/signup" />}
          >
            Start testing free
            <HiArrowRight className="size-4" aria-hidden />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 gap-2 px-8 text-base"
            nativeButton={false}
            render={
              // biome-ignore lint/a11y/useAnchorContent: Button children provide the accessible label
              <a
                href={LANDING_GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <SiGithub className="size-4" aria-hidden />
            View on GitHub
          </Button>
        </LandingReveal>

        <LandingReveal delay={0.25}>
          <p className="text-muted-foreground text-sm">
            Free to start · Deploy on your infrastructure · No vendor lock-in
          </p>
        </LandingReveal>
      </div>
    </section>
  );
}
