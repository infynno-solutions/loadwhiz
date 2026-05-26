"use client";

import { Badge } from "@loadwhiz/ui/components/badge";
import { Button } from "@loadwhiz/ui/components/button";
import { cn } from "@loadwhiz/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { HiArrowRight } from "react-icons/hi2";
import { SiGithub } from "react-icons/si";

import { LandingBackground } from "@/components/landing/landing-background";
import { LANDING_GITHUB_URL } from "@/components/landing/landing-constants";
import { LandingDashboardPreview } from "@/components/landing/landing-dashboard-preview";
import { landingEase } from "@/components/landing/landing-motion";

const heroStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: landingEase },
  },
};

export function LandingHero() {
  const reduced = useReducedMotion();

  return (
    <section
      id="hero"
      className="relative scroll-mt-20 overflow-hidden border-b"
      aria-labelledby="hero-title"
    >
      <LandingBackground variant="hero" />
      <div
        className={cn(
          "mx-auto w-full max-w-6xl px-4 sm:px-6",
          "relative grid items-center gap-10 py-20 md:gap-12 md:py-28 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-36",
        )}
      >
        <motion.div
          className="flex flex-col gap-6"
          variants={reduced ? undefined : heroStagger}
          initial={reduced ? false : "hidden"}
          animate={reduced ? undefined : "visible"}
        >
          <motion.div variants={reduced ? undefined : heroItem}>
            <Badge variant="secondary" className="w-fit">
              Performance testing for engineering teams
            </Badge>
          </motion.div>
          <motion.div
            className="flex flex-col gap-4"
            variants={reduced ? undefined : heroItem}
          >
            <h1
              id="hero-title"
              className="text-balance font-bold text-5xl tracking-tight sm:text-6xl lg:text-7xl"
            >
              Your users expect it to work.{" "}
              <span className="bg-linear-to-r from-violet-600 via-primary to-sky-600 bg-clip-text text-transparent dark:from-violet-400 dark:to-sky-400">
                Make sure it does.
              </span>
            </h1>
            <p className="max-w-xl text-pretty text-lg text-muted-foreground">
              LoadWhiz gives engineering teams a complete performance testing
              platform — validate API capacity, catch regressions before
              release, and deliver experiences that hold up under real demand.
            </p>
          </motion.div>
          <motion.div
            className="flex flex-col gap-3"
            variants={reduced ? undefined : heroItem}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                size="lg"
                className="h-11 gap-2"
                render={<Link to="/signup" />}
              >
                Start testing free
                <HiArrowRight className="size-4" aria-hidden />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 gap-2"
                nativeButton={false}
                render={
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
            </div>
            <p className="text-muted-foreground text-sm">
              Free to start · Deploy on your infrastructure · No vendor lock-in
            </p>
          </motion.div>
        </motion.div>

        <motion.div
          className="relative w-full lg:justify-self-end"
          initial={reduced ? false : { opacity: 0, y: 32, scale: 0.98 }}
          animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.75, delay: 0.35, ease: landingEase }}
        >
          <motion.div
            animate={reduced ? undefined : { y: [0, -10, 0] }}
            transition={{
              duration: 6,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          >
            <LandingDashboardPreview
              variant="live"
              className="shadow-primary/10 shadow-xl"
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
