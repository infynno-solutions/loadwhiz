"use client";

import { createFileRoute } from "@tanstack/react-router";
import { ResultDashboard } from "@/components/load-tests/result-dashboard";
import { useLoadTestResultStream } from "@/hooks/use-load-test-result-stream";
import { isActiveResultStatus } from "@/lib/load-test-actions";
import {
  type DashboardWithPartial,
  useLoadTestResult,
  useResultDashboard,
} from "@/lib/load-test-queries";
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

  const { data: result, isPending: resultPending } = useLoadTestResult(
    orgId,
    testId,
    resultId,
  );

  const isLive = result ? isActiveResultStatus(result.status) : true;

  const stream = useLoadTestResultStream(
    orgId,
    testId,
    resultId,
    Boolean(orgId && isLive),
  );

  const {
    data: polledDashboard,
    isPending: dashboardPending,
    isError: dashboardError,
    refetch,
  } = useResultDashboard(orgId, testId, resultId, {
    pollWhenLive: !stream.connected,
  });

  const dashboard: DashboardWithPartial | undefined =
    stream.dashboard ?? polledDashboard;
  const displayResult = stream.result ?? result;
  const partial = dashboard?.meta.partial === true;

  const isLoading =
    (resultPending && !displayResult) ||
    (dashboardPending && !dashboard && !dashboardError);

  return (
    <ResultDashboard
      orgId={orgId ?? ""}
      testId={testId}
      resultId={resultId}
      result={displayResult}
      data={dashboard}
      partial={partial}
      streamConnected={stream.connected}
      isLoading={isLoading}
      isError={dashboardError && !dashboard}
      onRetry={() => void refetch()}
    />
  );
}
