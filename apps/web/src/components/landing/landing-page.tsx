import { LandingCredibility } from "@/components/landing/landing-credibility";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingHowItWorks } from "@/components/landing/landing-how-it-works";
import { LandingIntegrations } from "@/components/landing/landing-integrations";
import { LandingLayout } from "@/components/landing/landing-layout";
import { LandingRoadmap } from "@/components/landing/landing-roadmap";
import { LandingUseCases } from "@/components/landing/landing-use-cases";
import { LandingValueProp } from "@/components/landing/landing-value-prop";

export function LandingPage() {
  return (
    <LandingLayout>
      <LandingHero />
      <LandingCredibility />
      <LandingValueProp />
      <LandingUseCases />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingIntegrations />
      <LandingRoadmap />
      <LandingCta />
    </LandingLayout>
  );
}
