"use client";

import { buttonVariants } from "@loadwhiz/ui/components/button";
import { cn } from "@loadwhiz/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { HiArrowRight } from "react-icons/hi2";
import { SiGithub } from "react-icons/si";

import { LandingBackground } from "@/components/landing/landing-background";
import { LandingBrandButton } from "@/components/landing/landing-brand-button";
import { LANDING_GITHUB_URL } from "@/components/landing/landing-constants";
import { LandingDashboardPreview } from "@/components/landing/landing-dashboard-preview";
import { landingEase } from "@/components/landing/landing-motion";
import {
  landingBodyLg,
  landingContainer,
  landingEyebrow,
  landingHeadingHero,
} from "@/components/landing/landing-styles";

const heroStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: landingEase },
  },
};

export function LandingHero() {
  const reduced = useReducedMotion();

  return (
    <section
      id="hero"
      className="relative scroll-mt-20 overflow-hidden pt-14 sm:pt-16"
      aria-labelledby="hero-title"
    >
      <LandingBackground variant="hero" />
      <div
        className={cn(
          landingContainer,
          "relative z-10 flex flex-col items-center py-12 text-center md:py-32",
        )}
      >
        <motion.div
          className="flex max-w-4xl flex-col items-center gap-6"
          variants={reduced ? undefined : heroStagger}
          initial={reduced ? false : "hidden"}
          animate={reduced ? undefined : "visible"}
        >
          <motion.a
            href="#features"
            variants={reduced ? undefined : heroItem}
            className={landingEyebrow}
          >
            Performance testing for engineering teams
            <HiArrowRight className="size-4" aria-hidden />
          </motion.a>

          <motion.div
            className="flex w-full flex-col items-center gap-4 text-center"
            variants={reduced ? undefined : heroItem}
          >
            <h1 id="hero-title" className={landingHeadingHero}>
              Your users expect it to work.{" "}
              <span className="text-neutral-900 dark:text-white">
                Make sure it does.
              </span>
            </h1>
            <p className={cn(landingBodyLg, "mx-auto max-w-2xl text-center")}>
              LoadWhiz gives engineering teams a complete performance testing
              platform — validate API capacity, catch regressions before
              release, and deliver experiences that hold up under real demand.
            </p>
          </motion.div>

          <motion.div
            className="flex flex-col items-center gap-3"
            variants={reduced ? undefined : heroItem}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
            </div>
            <p className="text-neutral-500 text-sm dark:text-neutral-500">
              Free to start · Deploy on your infrastructure · No vendor lock-in
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          className="relative mt-12 w-full max-w-5xl md:mt-16"
          initial={reduced ? false : { opacity: 0, y: 28 }}
          animate={reduced ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: landingEase }}
        >
          <div className="rounded-2xl border border-neutral-200 bg-white/80 p-1 shadow-2xl shadow-neutral-200/60 backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/80 dark:shadow-black/40">
            <LandingDashboardPreview variant="live" className="rounded-xl" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
