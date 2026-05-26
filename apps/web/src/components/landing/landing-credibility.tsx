"use client";

import { cn } from "@loadwhiz/ui/lib/utils";
import {
  HiClock,
  HiDocumentText,
  HiServer,
  HiUserGroup,
} from "react-icons/hi2";

import { LandingReveal } from "@/components/landing/landing-motion";
import {
  landingContainer,
  landingTextHeading,
  landingTextMuted,
} from "@/components/landing/landing-styles";

const ITEMS = [
  {
    label: "Set up in minutes",
    sublabel: "First test running fast",
    icon: HiClock,
  },
  {
    label: "Team collaboration",
    sublabel: "Roles, invites & workspaces",
    icon: HiUserGroup,
  },
  {
    label: "Your infrastructure",
    sublabel: "Full data control, self-hostable",
    icon: HiServer,
  },
  {
    label: "Complete audit trail",
    sublabel: "Every test run, fully logged",
    icon: HiDocumentText,
  },
] as const;

export function LandingCredibility() {
  return (
    <div className="border-neutral-200 border-y bg-neutral-50 py-10 md:py-14 dark:border-neutral-800 dark:bg-neutral-900/50">
      <div className={landingContainer}>
        <div className="grid grid-cols-2 gap-y-10 lg:grid-cols-4 lg:divide-x lg:divide-neutral-200 dark:lg:divide-neutral-800">
          {ITEMS.map((item) => (
            <LandingReveal key={item.label} variant="fadeIn">
              <div className="flex flex-col items-center gap-3 px-6 text-center">
                <div className="flex size-12 items-center justify-center rounded-xl border border-neutral-200 bg-white text-brand-primary dark:border-neutral-800 dark:bg-neutral-950">
                  <item.icon className="size-6" aria-hidden />
                </div>
                <div className="flex flex-col gap-1">
                  <p className={cn("font-medium text-sm", landingTextHeading)}>
                    {item.label}
                  </p>
                  <p className={cn("text-xs", landingTextMuted)}>
                    {item.sublabel}
                  </p>
                </div>
              </div>
            </LandingReveal>
          ))}
        </div>
      </div>
    </div>
  );
}
