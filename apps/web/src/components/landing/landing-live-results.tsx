"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@loadwhiz/ui/components/accordion";

import { cn } from "@loadwhiz/ui/lib/utils";

import { LandingDashboardPreview } from "@/components/landing/landing-dashboard-preview";
import {
  LandingReveal,
  LandingStagger,
  LandingStaggerItem,
} from "@/components/landing/landing-motion";
import { LandingSection } from "@/components/landing/landing-section";
import { landingBody } from "@/components/landing/landing-styles";

const BULLETS = [
  "Metrics stream live throughout the entire test — no polling, no waiting",
  "At-a-glance overview: requests, throughput, error rate, and latency",
  "Trend charts and distributions build as data flows in",
  "Complete per-endpoint breakdown ready the moment a test finishes",
] as const;

export function LandingLiveResults() {
  return (
    <LandingSection
      id="live-results"
      eyebrow="Real-time visibility"
      title="See what's happening — while it's happening"
      description="Most tools make you wait for a report. LoadWhiz streams performance data live so your team can act on what they see, not guess at what happened."
    >
      <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-12">
        <LandingStagger className="flex flex-col gap-3">
          {BULLETS.map((item) => (
            <LandingStaggerItem key={item}>
              <div
                className={cn(
                  "flex gap-3 text-sm leading-relaxed",
                  landingBody,
                )}
              >
                <span
                  className="mt-2 size-1.5 shrink-0 rounded-full bg-primary"
                  aria-hidden
                />
                {item}
              </div>
            </LandingStaggerItem>
          ))}
        </LandingStagger>
        <LandingReveal variant="scaleIn" delay={0.1}>
          <Accordion defaultValue={["during"]} className="rounded-xl border">
            <AccordionItem value="during">
              <AccordionTrigger className="px-4">
                During the run
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <LandingDashboardPreview variant="live" />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="after">
              <AccordionTrigger className="px-4">
                After completion
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <LandingDashboardPreview variant="complete" />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </LandingReveal>
      </div>
    </LandingSection>
  );
}
