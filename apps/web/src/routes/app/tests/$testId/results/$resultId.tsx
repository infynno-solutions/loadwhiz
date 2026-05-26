"use client";

import { createFileRoute } from "@tanstack/react-router";
import { ResultDashboard } from "@/components/load-tests/result-dashboard";
import { useResultDashboard } from "@/lib/load-test-queries";
import { useCurrentUser } from "@/lib/user-queries";

export const Route = createFileRoute("/app/tests/$testId/results/$resultId")({
  staticData: {
    breadcrumb: "Run result",
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
