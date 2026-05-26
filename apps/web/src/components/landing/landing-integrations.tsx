"use client";

import { Button } from "@loadwhiz/ui/components/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@loadwhiz/ui/components/card";
import { Link } from "@tanstack/react-router";
import {
  HiArrowRight,
  HiEnvelope,
  HiOutlineCodeBracket,
} from "react-icons/hi2";
import { TbWebhook } from "react-icons/tb";

import { LandingIcon } from "@/components/landing/landing-icon";
import {
  LandingGlowCard,
  LandingReveal,
  LandingStagger,
  LandingStaggerItem,
} from "@/components/landing/landing-motion";
import { LandingSection } from "@/components/landing/landing-section";

const INTEGRATIONS = [
  {
    title: "Instant notifications",
    description:
      "Trigger any downstream workflow — CI pipelines, incident tools, custom dashboards — the moment a test completes.",
    icon: TbWebhook,
    tone: "violet" as const,
  },
  {
    title: "Keep your team informed",
    description:
      "Automatic test completion summaries sent to the right people, every time.",
    icon: HiEnvelope,
    tone: "amber" as const,
  },
  {
    title: "Automate at any scale",
    description:
      "A fully documented REST API to integrate LoadWhiz into any pipeline, tool, or custom workflow.",
    icon: HiOutlineCodeBracket,
    tone: "sky" as const,
  },
];

export function LandingIntegrations() {
  return (
    <LandingSection
      id="integrations"
      align="center"
      eyebrow="Integrations"
      title="Fits into how your team already works"
      description="Connect LoadWhiz to the tools your team already uses — no new workflows required."
      className="bg-muted/20"
    >
      <div className="flex flex-col gap-6">
        {/* Integration cards */}
        <LandingStagger className="grid gap-4 md:grid-cols-3">
          {INTEGRATIONS.map((item) => (
            <LandingStaggerItem key={item.title} className="h-full">
              <LandingGlowCard className="h-full">
                <Card className="h-full transition-all duration-300 hover:shadow-lg">
                  <CardHeader className="gap-4">
                    <LandingIcon icon={item.icon} tone={item.tone} size="lg" />
                    <div className="flex flex-col gap-1.5">
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <CardDescription className="leading-relaxed">
                        {item.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </LandingGlowCard>
            </LandingStaggerItem>
          ))}
        </LandingStagger>

        {/* Self-host highlight */}
        <LandingReveal>
          <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-linear-to-br from-muted/80 via-muted/40 to-card p-8 md:p-10">
            <div className="absolute inset-0 bg-linear-to-br from-emerald-500/5 via-transparent to-sky-500/5" />
            <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex size-2 rounded-full bg-emerald-500" />
                  <span className="font-medium text-emerald-600 text-sm dark:text-emerald-400">
                    Self-hostable
                  </span>
                </div>
                <h3 className="font-bold text-xl tracking-tight md:text-2xl">
                  Your data, your infrastructure
                </h3>
                <p className="max-w-xl text-muted-foreground leading-relaxed">
                  Run LoadWhiz entirely on your own stack with a straightforward
                  Docker setup. Full control over where your data lives — ideal
                  for regulated industries and security-conscious teams.
                </p>
                <ul className="flex flex-col gap-2">
                  {[
                    "One-command Docker deploy",
                    "Data never leaves your network",
                    "Full control over storage and retention",
                  ].map((point) => (
                    <li
                      key={point}
                      className="flex items-center gap-2 text-muted-foreground text-sm"
                    >
                      <span className="size-1.5 shrink-0 rounded-full bg-emerald-500" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row md:flex-col">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-11 gap-2 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/5"
                  render={<Link to="/signup" />}
                >
                  Get started free
                  <HiArrowRight className="size-4" aria-hidden />
                </Button>
              </div>
            </div>
          </div>
        </LandingReveal>
      </div>
    </LandingSection>
  );
}
