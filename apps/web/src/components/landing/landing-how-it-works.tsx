"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@loadwhiz/ui/components/card";
import type { IconType } from "react-icons";
import {
  HiChartBar,
  HiCog6Tooth,
  HiPlay,
  HiShieldCheck,
} from "react-icons/hi2";

import { LandingBackground } from "@/components/landing/landing-background";
import { LandingIcon, type LandingIconTone } from "@/components/landing/landing-icon";
import { LandingSection } from "@/components/landing/landing-section";
import {
  LandingStagger,
  LandingStaggerItem,
} from "@/components/landing/landing-motion";

const STEPS: Array<{
  step: number;
  title: string;
  description: string;
  icon: IconType;
  tone: LandingIconTone;
}> = [
  {
    step: 1,
    title: "Add & verify a host",
    description:
      "Register the API you want to test. A quick automated check ensures your team is only testing what belongs to you.",
    icon: HiShieldCheck,
    tone: "emerald",
  },
  {
    step: 2,
    title: "Configure the test",
    description:
      "Define load patterns, duration, and pass/fail thresholds. Import from an OpenAPI spec or configure manually in minutes.",
    icon: HiCog6Tooth,
    tone: "violet",
  },
  {
    step: 3,
    title: "Run with one click",
    description:
      "Start your test with a single click. LoadWhiz handles the infrastructure — you stay focused on the results.",
    icon: HiPlay,
    tone: "sky",
  },
  {
    step: 4,
    title: "Watch live, then review",
    description:
      "Monitor performance in real time as the test runs. When it finishes, explore per-endpoint breakdowns and pass/fail history.",
    icon: HiChartBar,
    tone: "amber",
  },
];

export function LandingHowItWorks() {
  return (
    <LandingSection
      id="how-it-works"
      align="center"
      eyebrow="Workflow"
      eyebrowTone="sky"
      title="How it works"
      description="Four steps from verified target to actionable results."
      className="bg-muted/20"
    >
      <LandingBackground variant="section" className="opacity-40" />
      <LandingStagger className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((item) => (
          <LandingStaggerItem key={item.step}>
            <Card className="relative h-full overflow-hidden">
              <span
                aria-hidden
                className="pointer-events-none absolute top-3 right-4 select-none font-bold text-8xl text-muted-foreground/8 tabular-nums leading-none"
              >
                {item.step}
              </span>
              <CardHeader className="relative gap-4">
                <LandingIcon icon={item.icon} tone={item.tone} size="md" />
                <div>
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <CardDescription className="mt-1.5 leading-relaxed">
                    {item.description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </LandingStaggerItem>
        ))}
      </LandingStagger>
    </LandingSection>
  );
}
