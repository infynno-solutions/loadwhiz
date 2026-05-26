import { createFileRoute, redirect } from "@tanstack/react-router";

import {
  APP_ONBOARDING_PATH,
  needsOrganizationOnboarding,
} from "@/lib/user-queries";

export const Route = createFileRoute("/app/")({
  beforeLoad: ({ context }) => {
    throw redirect({
      to: needsOrganizationOnboarding(context.me)
        ? APP_ONBOARDING_PATH
        : "/app/dashboard",
      replace: true,
    });
  },
});
