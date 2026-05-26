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
  isLive?: boolean;
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
  isLive = false,
  partial = false,
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
        <Skeleton className="h-[220px] w-full" />
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

  const liveLabel = streamConnected ? "Live" : "Updating…";
  const timeRangeLabel = meta.finished_at
    ? `${formatLoadTestDate(meta.started_at)} — ${formatLoadTestDate(meta.finished_at)}`
    : `${formatLoadTestDate(meta.started_at)} — in progress`;

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
            <LoadTestResultStatusBadge status={result?.status ?? meta.status} />
            {isLive ? (
              <Badge variant="success" className="gap-1 text-xs">
                {!streamConnected ? <Spinner className="size-3" /> : null}
                {liveLabel}
              </Badge>
            ) : null}
            {!isLive && meta.passed != null ? (
              <Badge
                variant={meta.passed ? "success" : "destructive"}
                className="text-xs"
              >
                {meta.passed ? "Passed" : "Failed"}
              </Badge>
            ) : null}
          </div>
          <p className="font-medium text-sm">{meta.test_name}</p>
          <p className="text-muted-foreground text-sm">
            {meta.load_description} · {timeRangeLabel}
          </p>
          {result?.error_message ? (
            <p className="text-destructive text-sm">{result.error_message}</p>
          ) : null}
        </div>
        {isLive &&
        canAbortResultRun(result?.status ?? meta.status, meta.can_abort) ? (
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

      <div className="flex flex-col gap-2">
        <ResultOverviewCards overview={overview} />
        {isLive ? (
          <p className="text-muted-foreground text-xs">
            {partial
              ? "Metrics refresh automatically while k6 is running."
              : "Finalizing results…"}
          </p>
        ) : null}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Requests over time</CardTitle>
          <CardDescription>
            Requests and average response time by second
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <TimeseriesChart points={data.timeseries ?? []} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Response time distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <DistributionChart buckets={data.distribution ?? []} />
        </CardContent>
      </Card>

      {!isLive ? (
        <>
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
        </>
      ) : null}
    </div>
  );
}
