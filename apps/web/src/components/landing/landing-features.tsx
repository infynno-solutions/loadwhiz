"use client";

import { cn } from "@loadwhiz/ui/lib/utils";
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
  LandingStagger,
  LandingStaggerItem,
} from "@/components/landing/landing-motion";
import { LandingSection } from "@/components/landing/landing-section";

type Feature = {
  title: string;
  description: string;
  icon: IconType;
  tone: LandingIconTone;
};

const BENTO_PRIMARY: Feature = {
  title: "Safe, scoped testing",
  description:
    "Only test infrastructure your team owns — automated verification prevents misuse and protects your targets.",
  icon: HiOutlineShieldCheck,
  tone: "emerald",
};

const BENTO_SECONDARY: Feature[] = [
  {
    title: "Results as they happen",
    description:
      "Watch throughput, error rates, and latency build in real time. Catch issues before your test even finishes.",
    icon: HiOutlineBolt,
    tone: "brand",
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
];

const BENTO_TERTIARY: Feature[] = [
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

const bentoCardClass = cn(
  "flex h-full flex-col rounded-2xl bg-white shadow-sm ring-1 ring-black/10",
  "dark:bg-neutral-900 dark:shadow-white/5 dark:ring-white/10",
);

function FeatureCard({
  feature,
  className,
}: {
  feature: Feature;
  className?: string;
}) {
  return (
    <div className={cn(bentoCardClass, "gap-4 p-6 md:p-8", className)}>
      <LandingIcon icon={feature.icon} tone={feature.tone} size="lg" />
      <div className="flex flex-col gap-2">
        <h3 className="font-semibold text-neutral-900 text-sm dark:text-white">
          {feature.title}
        </h3>
        <p className="text-balance text-neutral-600 text-sm dark:text-neutral-400">
          {feature.description}
        </p>
      </div>
    </div>
  );
}

export function LandingFeatures() {
  return (
    <LandingSection
      id="features"
      align="center"
      eyebrow="Platform"
      title="One platform to validate, monitor, and automate"
      description="From first test to post-launch confidence, LoadWhiz covers every stage of your release cycle."
    >
      <LandingStagger className="flex flex-col gap-4">
        {/* Template-style bento: 1 tall card + 4 cells in a 3×2 grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:grid-rows-2">
          <LandingStaggerItem className="h-full md:row-span-2">
            <FeatureCard feature={BENTO_PRIMARY} />
          </LandingStaggerItem>
          {BENTO_SECONDARY.map((feature) => (
            <LandingStaggerItem key={feature.title} className="h-full">
              <FeatureCard feature={feature} />
            </LandingStaggerItem>
          ))}
        </div>

        {/* Remaining features in a simple 3-column row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BENTO_TERTIARY.map((feature) => (
            <LandingStaggerItem key={feature.title} className="h-full">
              <FeatureCard feature={feature} />
            </LandingStaggerItem>
          ))}
        </div>
      </LandingStagger>
    </LandingSection>
  );
}
