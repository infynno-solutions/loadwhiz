"use client";

import { Badge } from "@loadwhiz/ui/components/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@loadwhiz/ui/components/card";
import { HiGlobeAlt } from "react-icons/hi2";
import { PiPlugsConnectedBold } from "react-icons/pi";
import { TbTemplate } from "react-icons/tb";

import { LandingIcon } from "@/components/landing/landing-icon";
import { LANDING_GITHUB_URL } from "@/components/landing/landing-constants";
import {
  LandingReveal,
  LandingStagger,
  LandingStaggerItem,
} from "@/components/landing/landing-motion";
import { LandingSection } from "@/components/landing/landing-section";

const ROADMAP = [
  {
    title: "WebSocket load testing",
    description:
      "Stress WebSocket endpoints with connection churn, message throughput, and latency — built for real-time APIs.",
    icon: PiPlugsConnectedBold,
    tone: "violet" as const,
  },
  {
    title: "CI workflow templates",
    description:
      "Ready-made GitHub Actions and pipeline snippets to run LoadWhiz on every release.",
    icon: TbTemplate,
    tone: "sky" as const,
  },
  {
    title: "Multi-region generators",
    description:
      "Distribute virtual users across regions to mimic global traffic patterns.",
    icon: HiGlobeAlt,
    tone: "emerald" as const,
  },
];

export function LandingRoadmap() {
  return (
    <LandingSection
      id="roadmap"
      align="center"
      eyebrow="Roadmap"
      eyebrowTone="amber"
      title="On the roadmap"
      description="We build in the open. These are the next areas we're exploring — your feedback shapes priority."
    >
      <LandingStagger className="grid gap-5 md:grid-cols-3">
        {ROADMAP.map((item) => (
          <LandingStaggerItem key={item.title}>
            <Card className="flex h-full flex-col gap-0 border-border/60 bg-muted/20 transition-all duration-300 hover:border-border hover:shadow-md">
              <CardHeader className="gap-5">
                <div className="flex items-start justify-between gap-3">
                  <LandingIcon icon={item.icon} tone={item.tone} size="md" />
                  <Badge
                    variant="outline"
                    className="shrink-0 border-border/50 text-muted-foreground text-xs"
                  >
                    Coming soon
                  </Badge>
                </div>
                <div className="flex flex-col gap-2">
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {item.description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </LandingStaggerItem>
        ))}
      </LandingStagger>

      <LandingReveal delay={0.1} className="mt-6">
        <p className="text-center text-muted-foreground text-sm">
          Have a use case in mind?{" "}
          <a
            href={`${LANDING_GITHUB_URL}/issues`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
          >
            Open a GitHub issue
          </a>{" "}
          and tell us what you need next.
        </p>
      </LandingReveal>
    </LandingSection>
  );
}
