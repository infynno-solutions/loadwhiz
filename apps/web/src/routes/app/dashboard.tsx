"use client";

import { Button } from "@loadwhiz/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@loadwhiz/ui/components/empty";
import { Skeleton } from "@loadwhiz/ui/components/skeleton";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import {
  DashboardPerformanceHighlight,
  DashboardPerformanceHighlightSkeleton,
} from "@/components/dashboard/dashboard-performance-highlight";
import { DashboardRecentRuns } from "@/components/dashboard/dashboard-recent-runs";
import { DashboardStatCards } from "@/components/dashboard/dashboard-stat-cards";
import { useOrgDashboard } from "@/lib/dashboard-queries";
import { useCurrentUser } from "@/lib/user-queries";

export const Route = createFileRoute("/app/dashboard")({
  staticData: {
    breadcrumb: "Dashboard",
  },
  component: DashboardPage,
});

function StatCardsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-20 rounded-xl" />
      ))}
    </div>
  );
}

function DashboardPage() {
  const { data: user } = useCurrentUser();
  const orgId = user?.active_organization_id ?? undefined;

  const { data, isPending, isError, refetch } = useOrgDashboard(orgId);

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader orgId={orgId} />
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Could not load dashboard</EmptyTitle>
            <EmptyDescription>
              Something went wrong while fetching your organization stats.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  const hasVerifiedHosts = (data?.stats.hosts_verified ?? 0) > 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader orgId={orgId} hasVerifiedHosts={hasVerifiedHosts} />

      {isPending || !data ? (
        <StatCardsSkeleton />
      ) : (
        <DashboardStatCards stats={data.stats} />
      )}

      {isPending || !data ? (
        <DashboardPerformanceHighlightSkeleton />
      ) : data.performance_highlight ? (
        <DashboardPerformanceHighlight highlight={data.performance_highlight} />
      ) : null}

      {isPending || !data ? null : (
        <DashboardRecentRuns runs={data.recent_runs ?? []} />
      )}
    </div>
  );
}

function PageHeader({
  orgId,
  hasVerifiedHosts,
}: {
  orgId?: string;
  hasVerifiedHosts?: boolean;
}) {
  const canRunTest = orgId != null && hasVerifiedHosts;

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <h1 className="font-semibold text-xl">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Overview of your organization's load testing activity.
        </p>
      </div>
      {canRunTest ? (
        <Button
          size="sm"
          render={<Link to="/app/tests/new" />}
        >
          <PlusIcon />
          New test
        </Button>
      ) : null}
    </div>
  );
}
