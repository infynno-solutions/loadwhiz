"use client";

import { Card, CardHeader, CardTitle } from "@loadwhiz/ui/components/card";
import { cn } from "@loadwhiz/ui/lib/utils";
import { HiCheckCircle, HiXCircle } from "react-icons/hi2";

import { LandingSection } from "@/components/landing/landing-section";
import { LandingIcon } from "@/components/landing/landing-icon";
import {
  LandingGlowCard,
  LandingStagger,
  LandingStaggerItem,
} from "@/components/landing/landing-motion";

const WITHOUT_ITEMS = [
  "Performance issues discovered in production, not pre-release",
  "Manual test setups that break with every schema change",
  "No visibility into system behavior until the run is over",
] as const;

const WITH_ITEMS = [
  "Automated performance gates integrated into your release cycle",
  "Real-time visibility so your team spots issues in seconds, not hours",
  "Clear pass/fail results with a full history of every test run",
] as const;

export function LandingValueProp() {
  return (
    <LandingSection
      id="why"
      align="center"
      eyebrow="Why LoadWhiz"
      eyebrowTone="emerald"
      title="Release fast without flying blind"
      description="Engineering teams that ship often need to know their systems can handle it. LoadWhiz makes performance validation a repeatable part of your release process — not an afterthought."
    >
      <LandingStagger className="grid gap-5 md:grid-cols-2">
        <LandingStaggerItem>
          <Card className="h-full border-rose-500/20 bg-linear-to-br from-rose-500/5 to-card">
            <CardHeader className="gap-4">
              <div className="flex items-center gap-2">
                <LandingIcon icon={HiXCircle} tone="rose" size="md" />
                <CardTitle className="text-base">The guesswork approach</CardTitle>
              </div>
              <ul className="flex flex-col gap-3">
                {WITHOUT_ITEMS.map((item) => (
                  <li key={item} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                    <HiXCircle
                      className="mt-0.5 size-4 shrink-0 text-rose-500/60"
                      aria-hidden
                    />
                    {item}
                  </li>
                ))}
              </ul>
            </CardHeader>
          </Card>
        </LandingStaggerItem>
        <LandingStaggerItem>
          <LandingGlowCard className="h-full">
            <Card
              className={cn(
                "h-full border-emerald-500/25 bg-linear-to-br from-emerald-500/8 to-card",
              )}
            >
              <CardHeader className="gap-4">
                <div className="flex items-center gap-2">
                  <LandingIcon icon={HiCheckCircle} tone="emerald" size="md" />
                  <CardTitle className="text-base">With LoadWhiz</CardTitle>
                </div>
                <ul className="flex flex-col gap-3">
                  {WITH_ITEMS.map((item) => (
                    <li key={item} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                      <HiCheckCircle
                        className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                        aria-hidden
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardHeader>
            </Card>
          </LandingGlowCard>
        </LandingStaggerItem>
      </LandingStagger>
    </LandingSection>
  );
}
