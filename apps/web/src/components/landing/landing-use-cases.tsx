"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@loadwhiz/ui/components/card";
import type { IconType } from "react-icons";
import {
  HiBolt,
  HiChartBar,
  HiCodeBracket,
  HiShieldCheck,
} from "react-icons/hi2";

import { LandingIcon, type LandingIconTone } from "@/components/landing/landing-icon";
import {
  LandingGlowCard,
  LandingStagger,
  LandingStaggerItem,
} from "@/components/landing/landing-motion";
import { LandingSection } from "@/components/landing/landing-section";

const USE_CASES: Array<{
  title: string;
  description: string;
  icon: IconType;
  tone: LandingIconTone;
}> = [
  {
    title: "Test every endpoint before it ships",
    description:
      "Validate your API against real-world load patterns before any release. Catch the issues your unit tests won't find.",
    icon: HiCodeBracket,
    tone: "violet",
  },
  {
    title: "Enforce performance SLAs across services",
    description:
      "Define pass/fail thresholds for every service. Every run tells you exactly what's in compliance and what isn't.",
    icon: HiShieldCheck,
    tone: "emerald",
  },
  {
    title: "Make performance a standard part of QA",
    description:
      "Trigger load tests from your CI pipeline on every build. No manual steps, no performance regressions slipping to production.",
    icon: HiChartBar,
    tone: "sky",
  },
  {
    title: "Prepare your infrastructure for demand spikes",
    description:
      "Know your system's ceiling before your campaign goes live. Simulate the traffic surge before it hits.",
    icon: HiBolt,
    tone: "amber",
  },
];

export function LandingUseCases() {
  return (
    <LandingSection
      id="use-cases"
      align="center"
      eyebrow="Use cases"
      eyebrowTone="sky"
      title="Built for teams that can't afford surprises"
      description="Whether you're shipping new APIs, enforcing SLAs, or scaling for a major launch — LoadWhiz fits into how your team already works."
      className="bg-muted/20"
    >
      <LandingStagger className="grid gap-5 sm:grid-cols-2">
        {USE_CASES.map((item) => (
          <LandingStaggerItem key={item.title}>
            <LandingGlowCard className="h-full">
              <Card className="h-full transition-shadow duration-300 hover:shadow-lg">
                <CardHeader className="gap-4">
                  <LandingIcon icon={item.icon} tone={item.tone} size="lg" />
                  <div className="flex flex-col gap-1.5">
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">
                      {item.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </LandingGlowCard>
          </LandingStaggerItem>
        ))}
      </LandingStagger>
    </LandingSection>
  );
}
