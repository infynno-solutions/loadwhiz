"use client";

import { createFileRoute, Outlet } from "@tanstack/react-router";
import { loadTestsGetOptions } from "@/api/generated/@tanstack/react-query.gen";
import { getLoadTestDisplayName } from "@/lib/load-test-queries";

export const Route = createFileRoute("/app/tests/$testId")({
  beforeLoad: async ({ params, context }) => {
    const orgId = context.me?.active_organization_id;
    if (!orgId) return { breadcrumb: "Test" };
    try {
      const test = await context.queryClient.fetchQuery(
        loadTestsGetOptions({
          path: { org_id: orgId, test_id: params.testId },
        }),
      );
      return { breadcrumb: getLoadTestDisplayName(test) };
    } catch {
      return { breadcrumb: "Test" };
    }
  },
  component: TestDetailLayout,
});

function TestDetailLayout() {
  return <Outlet />;
}
