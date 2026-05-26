"use client";

import { Button } from "@loadwhiz/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@loadwhiz/ui/components/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@loadwhiz/ui/components/empty";
import { Skeleton } from "@loadwhiz/ui/components/skeleton";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { z } from "zod";
import { CompareAggregates } from "@/components/load-tests/compare/compare-aggregates";
import { CompareByUrlTable } from "@/components/load-tests/compare/compare-by-url-table";
import { CompareDistributionChart } from "@/components/load-tests/compare/compare-distribution-chart";
import { CompareOverviewTable } from "@/components/load-tests/compare/compare-overview-table";
import { CompareRunCards } from "@/components/load-tests/compare/compare-run-cards";
import { CompareTimeseriesChart } from "@/components/load-tests/compare/compare-timeseries-chart";
import { isCompareDashboardReady } from "@/lib/compare-runs";
import {
  useCompareDashboards,
  useLoadTest,
} from "@/lib/load-test-queries";
import { useCurrentUser } from "@/lib/user-queries";

const compareSearchSchema = z.object({
  a: z.string().uuid(),
  b: z.string().uuid(),
});

export const Route = createFileRoute("/app/tests/$testId/compare")({
  staticData: {
    breadcrumb: "Compare runs",
  },
  validateSearch: compareSearchSchema,
  component: CompareRunsPage,
});

function CompareRunsPage() {
  const { testId } = Route.useParams();
  const { a, b } = Route.useSearch();
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const orgId = user?.active_organization_id ?? undefined;

  const { data: test } = useLoadTest(orgId, testId);
  const {
    dashboardA,
    dashboardB,
    isPending,
    isError,
    refetch,
  } = useCompareDashboards(orgId, testId, a, b);

  const readyA = isCompareDashboardReady(dashboardA);
  const readyB = isCompareDashboardReady(dashboardB);

  const handleSwap = () => {
    void navigate({
      to: "/app/tests/$testId/compare",
      params: { testId },
      search: { a: b, b: a },
    });
  };

  if (!orgId) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>No active organization</EmptyTitle>
        </EmptyHeader>
      </Empty>
    );
  }

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

      <div>
        <h1 className="font-semibold text-xl">Compare runs</h1>
        {test ? (
          <p className="text-muted-foreground text-sm">{test.name ?? testId}</p>
        ) : null}
      </div>

      {isPending ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : null}

      {isError && !isPending ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Could not load run data</EmptyTitle>
            <EmptyDescription>
              Select two completed runs from Run history to compare.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          </EmptyContent>
        </Empty>
      ) : null}

      {!isPending && dashboardA && dashboardB && (!readyA || !readyB) ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Runs not ready to compare</EmptyTitle>
            <EmptyDescription>
              Both runs must be finished with final metrics. Live or incomplete
              runs cannot be compared.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              variant="outline"
              render={<Link to="/app/tests/$testId" params={{ testId }} />}
            >
              Choose runs
            </Button>
          </EmptyContent>
        </Empty>
      ) : null}

      {!isPending && readyA && readyB && dashboardA && dashboardB ? (
        <>
          <CompareRunCards
            testId={testId}
            dashboardA={dashboardA}
            dashboardB={dashboardB}
            onSwap={handleSwap}
          />

          <CompareOverviewTable
            dashboardA={dashboardA}
            dashboardB={dashboardB}
          />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Requests over time</CardTitle>
              <CardDescription>Run A vs Run B</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <CompareTimeseriesChart
                dashboardA={dashboardA}
                dashboardB={dashboardB}
                metric="requests"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Average response over time
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CompareTimeseriesChart
                dashboardA={dashboardA}
                dashboardB={dashboardB}
                metric="avg_ms"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                Response time distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <CompareDistributionChart
                dashboardA={dashboardA}
                dashboardB={dashboardB}
              />
            </CardContent>
          </Card>

          <CompareAggregates dashboardA={dashboardA} dashboardB={dashboardB} />

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Per-URL comparison</CardTitle>
              <CardDescription>
                Endpoints with higher error rate or latency in Run B are
                highlighted
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CompareByUrlTable
                dashboardA={dashboardA}
                dashboardB={dashboardB}
              />
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
