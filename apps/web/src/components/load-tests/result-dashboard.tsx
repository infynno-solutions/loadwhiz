"use client";

import { Badge } from "@loadwhiz/ui/components/badge";
import { Button } from "@loadwhiz/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@loadwhiz/ui/components/card";
import { Skeleton } from "@loadwhiz/ui/components/skeleton";
import { Spinner } from "@loadwhiz/ui/components/spinner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { toast } from "sonner";

import { loadTestsStopMutation } from "@/api/generated/@tanstack/react-query.gen";
import type {
  LoadTestResultDashboardResponse,
  LoadTestResultSummary,
} from "@/api/generated/types.gen";
import { ByUrlTable } from "@/components/load-tests/by-url-table";
import { DistributionChart } from "@/components/load-tests/distribution-chart";
import { LoadTestResultStatusBadge } from "@/components/load-tests/load-test-result-status-badge";
import { ResultOverviewCards } from "@/components/load-tests/result-overview-cards";
import { ResultRunProgress } from "@/components/load-tests/result-run-progress";
import { TimeseriesChart } from "@/components/load-tests/timeseries-chart";
import { getApiErrorMessage } from "@/lib/api-errors";
import { canAbortResultRun, formatLoadTestDate } from "@/lib/load-test-actions";
import {
  loadTestsGetQueryKeyFor,
  loadTestsListQueryKeyForOrg,
  loadTestsResultsDashboardQueryKeyFor,
} from "@/lib/load-test-queries";

type ResultDashboardProps = {
  orgId: string;
  testId: string;
  resultId: string;
  result?: LoadTestResultSummary;
  data: LoadTestResultDashboardResponse | undefined;
  partial?: boolean;
  streamConnected?: boolean;
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
};

export function ResultDashboard({
  orgId,
  testId,
  resultId,
  result,
  data,
  partial,
  streamConnected,
  isLoading,
  isError,
  onRetry,
}: ResultDashboardProps) {
  const queryClient = useQueryClient();
  const stopTest = useMutation(loadTestsStopMutation());

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError && !data) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm">
          Could not load result dashboard.
        </p>
        {onRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { meta, overview, aggregates } = data;
  const summaryResult: LoadTestResultSummary | undefined =
    result ??
    ({
      result_id: meta.result_id,
      test_id: meta.test_id,
      status: meta.status,
      started_at: meta.started_at,
      finished_at: meta.finished_at,
      passed: meta.passed,
      metrics: overview
        ? {
            total_requests: overview.total_requests,
            error_rate_percent: overview.error_rate_percent,
            rps: overview.rps,
            avg_ms: overview.avg_response_ms,
            p95_ms: null,
            duration_seconds: meta.duration_seconds,
          }
        : null,
      exit_code: null,
      error_message: null,
      created_at: meta.started_at ?? new Date().toISOString(),
    } satisfies LoadTestResultSummary);

  const handleAbort = async () => {
    try {
      await stopTest.mutateAsync({
        path: { org_id: orgId, test_id: testId },
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: loadTestsListQueryKeyForOrg(orgId),
        }),
        queryClient.invalidateQueries({
          queryKey: loadTestsGetQueryKeyFor(orgId, testId),
        }),
        queryClient.invalidateQueries({
          queryKey: loadTestsResultsDashboardQueryKeyFor(
            orgId,
            testId,
            resultId,
          ),
        }),
      ]);
      toast.success("Run stopped.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not stop run."));
    }
  };

  const showLiveBanner = partial && (data.timeseries?.length ?? 0) === 0;

  return (
    <div className="flex flex-col gap-6">
      <Button
        variant="outline"
        size="sm"
        className="w-fit"
        render={<Link to="/app/tests/$testId" params={{ testId }} />}
      >
        <ArrowLeftIcon />
        Back to test
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-semibold text-xl">Run result</h1>
            <LoadTestResultStatusBadge status={meta.status} />
            {partial ? (
              <Badge variant="outline" className="text-xs">
                {streamConnected ? "Live" : "Updating…"}
              </Badge>
            ) : null}
            {meta.passed != null ? (
              <span className="text-muted-foreground text-sm">
                {meta.passed ? "Passed" : "Failed"}
              </span>
            ) : null}
          </div>
          <p className="font-medium text-sm">{meta.test_name}</p>
          <p className="text-muted-foreground text-sm">
            {meta.load_description} · {formatLoadTestDate(meta.started_at)}
            {meta.finished_at
              ? ` — ${formatLoadTestDate(meta.finished_at)}`
              : " — in progress"}
          </p>
          {result?.error_message ? (
            <p className="text-destructive text-sm">{result.error_message}</p>
          ) : null}
        </div>
        {canAbortResultRun(meta.status, meta.can_abort) ? (
          <Button
            variant="outline"
            size="sm"
            disabled={stopTest.isPending}
            onClick={() => void handleAbort()}
          >
            {stopTest.isPending ? <Spinner /> : null}
            Stop run
          </Button>
        ) : null}
      </div>

      {showLiveBanner ? (
        <ResultRunProgress result={summaryResult} partial={partial} />
      ) : null}

      <ResultOverviewCards overview={overview} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Requests over time</CardTitle>
          <CardDescription>
            Requests and average response time by second
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TimeseriesChart points={data.timeseries ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Response time distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DistributionChart buckets={data.distribution ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Aggregates</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">Median</dt>
              <dd>
                {aggregates.response_times.med_ms != null
                  ? `${aggregates.response_times.med_ms} ms`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">P90</dt>
              <dd>
                {aggregates.response_times.p90_ms != null
                  ? `${aggregates.response_times.p90_ms} ms`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">P95</dt>
              <dd>
                {aggregates.response_times.p95_ms != null
                  ? `${aggregates.response_times.p95_ms} ms`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Success</dt>
              <dd>{aggregates.response_counts.success ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Timeouts</dt>
              <dd>{aggregates.response_counts.timeout ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">5xx errors</dt>
              <dd>{aggregates.response_counts.error_5xx ?? "—"}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">By URL</CardTitle>
        </CardHeader>
        <CardContent>
          <ByUrlTable rows={data.by_url ?? []} />
        </CardContent>
      </Card>
    </div>
  );
}
