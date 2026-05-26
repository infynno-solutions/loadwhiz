"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@loadwhiz/ui/components/card";
import type { IconType } from "react-icons";
import {
  HiBellAlert,
  HiCalendarDays,
  HiCodeBracket,
  HiOutlineBolt,
  HiOutlineShieldCheck,
  HiUserGroup,
} from "react-icons/hi2";
import { SiOpenapiinitiative } from "react-icons/si";
import { TbBrandDocker } from "react-icons/tb";

import {
  LandingIcon,
  type LandingIconTone,
} from "@/components/landing/landing-icon";
import {
  LandingGlowCard,
  LandingStagger,
  LandingStaggerItem,
} from "@/components/landing/landing-motion";
import { LandingSection } from "@/components/landing/landing-section";

type Feature = {
  title: string;
  description: string;
  icon: IconType;
  tone: LandingIconTone;
  featured?: boolean;
};

const FEATURES: Feature[] = [
  {
    title: "Safe, scoped testing",
    description:
      "Only test infrastructure your team owns — automated verification prevents misuse and protects your targets.",
    icon: HiOutlineShieldCheck,
    tone: "emerald",
    featured: true,
  },
  {
    title: "Results as they happen",
    description:
      "Watch throughput, error rates, and latency build in real time. Catch issues before your test even finishes.",
    icon: HiOutlineBolt,
    tone: "violet",
    featured: true,
  },
  {
    title: "Test your full API in minutes",
    description:
      "Import your OpenAPI spec to generate test scenarios automatically — no manual configuration required.",
    icon: SiOpenapiinitiative,
    tone: "amber",
  },
  {
    title: "Industry-standard execution",
    description:
      "Every test runs on proven, battle-tested infrastructure. Consistent, reproducible results across every run.",
    icon: TbBrandDocker,
    tone: "sky",
  },
  {
    title: "Built for entire teams",
    description:
      "Shared workspaces, role-based access, and email invites — so your whole team stays aligned.",
    icon: HiUserGroup,
    tone: "rose",
  },
  {
    title: "Fits your existing workflow",
    description:
      "Get notified in the tools you already use. Trigger pipelines or receive summaries the moment a test completes.",
    icon: HiBellAlert,
    tone: "orange",
  },
  {
    title: "Automate everything",
    description:
      "A fully documented REST API to trigger tests, retrieve results, and integrate LoadWhiz into any pipeline.",
    icon: HiCodeBracket,
    tone: "brand",
  },
  {
    title: "Control at every stage",
    description:
      "Schedule tests around deployment windows, or stop a run instantly if something looks off.",
    icon: HiCalendarDays,
    tone: "teal",
  },
];

const featured = FEATURES.filter((f) => f.featured);
const regular = FEATURES.filter((f) => !f.featured);

export function LandingFeatures() {
  return (
    <LandingSection
      id="features"
      align="center"
      eyebrow="Platform"
      eyebrowTone="violet"
      title="One platform to validate, monitor, and automate"
      description="From first test to post-launch confidence, LoadWhiz covers every stage of your release cycle."
    >
      <LandingStagger className="flex flex-col gap-4">
        {/* Featured row — 2 cards, each half width */}
        <div className="grid gap-4 md:grid-cols-2">
          {featured.map((feature) => (
            <LandingStaggerItem key={feature.title} className="h-full">
              <LandingGlowCard className="h-full">
                <Card className="h-full border-primary/15 bg-linear-to-br from-muted/50 to-card shadow-sm transition-shadow duration-300 hover:shadow-lg">
                  <CardHeader className="gap-4 pt-6 pb-6">
                    <LandingIcon
                      icon={feature.icon}
                      tone={feature.tone}
                      size="lg"
                    />
                    <div className="flex flex-col gap-1.5">
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                      <CardDescription className="leading-relaxed">
                        {feature.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              </LandingGlowCard>
            </LandingStaggerItem>
          ))}
        </div>

        {/* Regular grid — 3 columns */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {regular.map((feature) => (
            <LandingStaggerItem key={feature.title}>
              <Card className="h-full transition-all duration-300 hover:border-border/80 hover:shadow-md">
                <CardHeader className="gap-4">
                  <LandingIcon
                    icon={feature.icon}
                    tone={feature.tone}
                    size="md"
                  />
                  <div className="flex flex-col gap-1.5">
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                    <CardDescription className="leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </div>
                </CardHeader>
              </Card>
            </LandingStaggerItem>
          ))}
        </div>
      </LandingStagger>
    </LandingSection>
  );
}
