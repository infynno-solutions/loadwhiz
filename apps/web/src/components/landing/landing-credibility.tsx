"use client";

import {
  HiClock,
  HiDocumentText,
  HiServer,
  HiUserGroup,
} from "react-icons/hi2";

import { LandingReveal } from "@/components/landing/landing-motion";

const ITEMS = [
  {
    label: "Set up in minutes",
    sublabel: "First test running fast",
    icon: HiClock,
    color: "text-sky-500",
    bg: "bg-sky-500/10",
  },
  {
    label: "Team collaboration",
    sublabel: "Roles, invites & workspaces",
    icon: HiUserGroup,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    label: "Your infrastructure",
    sublabel: "Full data control, self-hostable",
    icon: HiServer,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    label: "Complete audit trail",
    sublabel: "Every test run, fully logged",
    icon: HiDocumentText,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
] as const;

export function LandingCredibility() {
  return (
    <div className="border-y bg-muted/30 py-10 md:py-14">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-2 gap-y-10 lg:grid-cols-4 lg:divide-x lg:divide-border/50">
          {ITEMS.map((item) => (
            <LandingReveal key={item.label} variant="fadeIn">
              <div className="flex flex-col items-center gap-4 px-6 text-center">
                <div
                  className={`flex size-14 items-center justify-center rounded-2xl ${item.bg}`}
                >
                  <item.icon className={`size-7 ${item.color}`} aria-hidden />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="font-semibold text-sm leading-snug">
                    {item.label}
                  </p>
                  <p className="text-muted-foreground text-xs leading-snug">
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
