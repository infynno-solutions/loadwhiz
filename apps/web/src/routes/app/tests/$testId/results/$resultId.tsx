"use client";

import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ResultDashboard } from "@/components/load-tests/result-dashboard";
import { useLoadTestResultStream } from "@/hooks/use-load-test-result-stream";
import { isActiveResultStatus } from "@/lib/load-test-actions";
import { useLoadTestResult, useResultDashboard } from "@/lib/load-test-queries";
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

  const {
    data: result,
    isPending: resultPending,
    refetch: refetchResult,
  } = useLoadTestResult(orgId, testId, resultId);

  const status = result?.status ?? undefined;
  const isLive = status ? isActiveResultStatus(status) : true;

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
    refetch: refetchDashboard,
  } = useResultDashboard(orgId, testId, resultId, {
    pollWhenLive: isLive,
  });

  const dashboard = useMemo(() => {
    if (!isLive) {
      return polledDashboard ?? stream.dashboard;
    }
    return stream.dashboard ?? polledDashboard;
  }, [isLive, polledDashboard, stream.dashboard]);

  const displayResult = result ?? stream.result;
  const resolvedStatus = displayResult?.status ?? dashboard?.meta.status;
  const resolvedIsLive = resolvedStatus
    ? isActiveResultStatus(resolvedStatus)
    : isLive;
  const partial = resolvedIsLive && dashboard?.meta.partial !== false;

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
      isLive={resolvedIsLive}
      partial={partial}
      streamConnected={stream.connected}
      isLoading={isLoading}
      isError={dashboardError && !dashboard}
      onRetry={() => {
        void refetchResult();
        void refetchDashboard();
      }}
    />
  );
}
