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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@loadwhiz/ui/components/tabs";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { DeleteLoadTestDialog } from "@/components/load-tests/delete-load-test-dialog";
import { LoadTestConfigForm } from "@/components/load-tests/load-test-config-form";
import { LoadTestDetailHeader } from "@/components/load-tests/load-test-detail-header";
import { LoadTestResultsTable } from "@/components/load-tests/load-test-results-table";
import { useHostsList } from "@/lib/host-queries";
import { canEditLoadTest } from "@/lib/load-test-actions";
import {
  buildHostNameMap,
  mergeResultsWithLatest,
  reconcileLoadTestStatusFromResults,
  useLoadTest,
  useLoadTestResults,
  useVerifiedHosts,
} from "@/lib/load-test-queries";
import { useCurrentUser } from "@/lib/user-queries";

export const Route = createFileRoute("/app/tests/$testId/")({
  component: TestDetailPage,
});

function TestDetailPage() {
  const { testId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const orgId = user?.active_organization_id;
  const [deleteOpen, setDeleteOpen] = useState(false);

  const {
    data: test,
    isPending,
    isError,
    refetch,
  } = useLoadTest(orgId, testId);
  const { data: verifiedHosts = [] } = useVerifiedHosts(orgId);
  const { data: allHosts = [] } = useHostsList(orgId);
  const hostNameById = buildHostNameMap(allHosts);
  const { data: results = [], isPending: resultsPending } = useLoadTestResults(
    orgId,
    testId,
    test?.status,
  );

  const displayResults = useMemo(
    () => mergeResultsWithLatest(results, test?.latest_result),
    [results, test?.latest_result],
  );

  useEffect(() => {
    if (!orgId || !test) return;
    reconcileLoadTestStatusFromResults(
      queryClient,
      orgId,
      testId,
      test,
      displayResults,
    );
  }, [orgId, testId, test, displayResults, queryClient]);

  if (!orgId) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>No active organization</EmptyTitle>
          <EmptyDescription>
            Select an organization to view this load test.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (isPending) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !test) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>Could not load test</EmptyTitle>
          <EmptyDescription>
            This load test may have been deleted or you may not have access.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <LoadTestDetailHeader
        orgId={orgId}
        test={test}
        hostLabel={hostNameById.get(test.host_id)}
        onDelete={() => setDeleteOpen(true)}
      />

      <Tabs defaultValue="history" className="gap-4">
        <TabsList>
          <TabsTrigger value="history">Run history</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="flex flex-col gap-4">
          {displayResults.length > 0 || resultsPending ? (
            <p className="text-muted-foreground text-sm">
              Past runs and links to detailed results for passed runs.
            </p>
          ) : null}
          <LoadTestResultsTable
            testId={testId}
            results={displayResults}
            isLoading={resultsPending}
          />
        </TabsContent>

        <TabsContent value="configuration" className="flex flex-col gap-4">
          {!canEditLoadTest(test) ? (
            <p className="text-muted-foreground text-sm">
              Expand configuration to review all settings for this test.
            </p>
          ) : (
            <p className="text-muted-foreground text-sm">
              Expand configuration to edit this draft. Save when you are done.
            </p>
          )}
          <LoadTestConfigForm
            orgId={orgId}
            test={test}
            verifiedHosts={verifiedHosts}
            hostLabel={hostNameById.get(test.host_id)}
            readOnly={!canEditLoadTest(test)}
          />
        </TabsContent>
      </Tabs>

      <DeleteLoadTestDialog
        orgId={orgId}
        test={test}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => {
          void navigate({ to: "/app/tests" });
        }}
      />
    </div>
  );
}
