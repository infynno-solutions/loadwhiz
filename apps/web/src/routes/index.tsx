import { createFileRoute } from "@tanstack/react-router";

import { LandingPage } from "@/components/landing/landing-page";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title:
          "LoadWhiz — Open source load testing with verified hosts and live results",
      },
      {
        name: "description",
        content:
          "HTTP load testing for teams: verify targets with DNS or HTTP, run Grafana k6 in Docker, and watch live SSE dashboards. Open source, self-hostable, API-first.",
      },
    ],
  }),
  component: LandingPage,
});
