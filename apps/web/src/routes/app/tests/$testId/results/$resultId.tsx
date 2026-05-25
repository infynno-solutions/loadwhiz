"use client";

import { createFileRoute } from "@tanstack/react-router";
import { loadTestsGetOptions } from "@/api/generated/@tanstack/react-query.gen";
import { ResultDashboard } from "@/components/load-tests/result-dashboard";
import {
  getLoadTestDisplayName,
  useResultDashboard,
} from "@/lib/load-test-queries";
import { useCurrentUser } from "@/lib/user-queries";

export const Route = createFileRoute("/app/tests/$testId/results/$resultId")({
  staticData: {
    breadcrumb: "Results",
  },
  beforeLoad: async ({ params, context }) => {
    const orgId = context.me?.active_organization_id;
    if (!orgId) return { breadcrumb: "Results" };
    try {
      const test = await context.queryClient.fetchQuery(
        loadTestsGetOptions({
          path: { org_id: orgId, test_id: params.testId },
        }),
      );
      return {
        breadcrumb: `${getLoadTestDisplayName(test)} · Results`,
      };
    } catch {
      return { breadcrumb: "Results" };
    }
  },
  component: ResultDashboardPage,
});

function ResultDashboardPage() {
  const { testId, resultId } = Route.useParams();
  const { data: user } = useCurrentUser();
  const orgId = user?.active_organization_id;

  const { data, isPending, isError, refetch } = useResultDashboard(
    orgId,
    testId,
    resultId,
  );

  return (
    <ResultDashboard
      orgId={orgId ?? ""}
      testId={testId}
      data={data}
      isLoading={isPending}
      isError={isError}
      onRetry={() => void refetch()}
    />
  );
}
