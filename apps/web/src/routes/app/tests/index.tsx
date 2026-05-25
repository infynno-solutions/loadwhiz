"use client";

import { Button } from "@loadwhiz/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@loadwhiz/ui/components/empty";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2Icon, FlaskConicalIcon } from "lucide-react";
import { useMemo, useState } from "react";
import type { LoadTestResponse } from "@/api/generated/types.gen";
import { DeleteLoadTestDialog } from "@/components/load-tests/delete-load-test-dialog";
import { LoadTestsDataTable } from "@/components/load-tests/load-tests-data-table";
import { LoadTestsToolbar } from "@/components/load-tests/load-tests-toolbar";
import { useHostsList } from "@/lib/host-queries";
import {
  buildHostNameMap,
  useLoadTestsList,
  useVerifiedHosts,
} from "@/lib/load-test-queries";
import { useCurrentUser } from "@/lib/user-queries";

export const Route = createFileRoute("/app/tests/")({
  staticData: {
    breadcrumb: "Load tests",
  },
  component: TestsListPage,
});

function TestsListPage() {
  const { data: user } = useCurrentUser();
  const orgId = user?.active_organization_id;
  const [hostFilter, setHostFilter] = useState<string | null>(null);
  const [deleteTest, setDeleteTest] = useState<LoadTestResponse | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: verifiedHosts = [] } = useVerifiedHosts(orgId);
  const { data: allHosts = [] } = useHostsList(orgId);
  const {
    data: tests = [],
    isPending,
    isError,
    refetch,
  } = useLoadTestsList(orgId, hostFilter);

  const hostNameById = useMemo(() => buildHostNameMap(allHosts), [allHosts]);

  if (!orgId) {
    return (
      <div className="flex flex-col gap-6">
        <LoadTestsToolbar
          hostFilter={hostFilter}
          onHostFilterChange={setHostFilter}
          verifiedHosts={[]}
          disabled
        />
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2Icon />
            </EmptyMedia>
            <EmptyTitle>No active organization</EmptyTitle>
            <EmptyDescription>
              Select or create an organization in the sidebar to manage load
              tests.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <LoadTestsToolbar
        hostFilter={hostFilter}
        onHostFilterChange={setHostFilter}
        verifiedHosts={verifiedHosts}
      />

      {isError ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Could not load tests</EmptyTitle>
            <EmptyDescription>
              Something went wrong while fetching load tests.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          </EmptyContent>
        </Empty>
      ) : null}

      {!isError && !isPending && tests.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FlaskConicalIcon />
            </EmptyMedia>
            <EmptyTitle>No load tests yet</EmptyTitle>
            <EmptyDescription>
              {verifiedHosts.length === 0 ? (
                <>
                  Verify a host on the{" "}
                  <Link
                    to="/app/hosts"
                    className="cursor-pointer text-primary underline"
                  >
                    Hosts
                  </Link>{" "}
                  page, then create your first load test.
                </>
              ) : (
                "Create a manual test or import URLs from OpenAPI."
              )}
            </EmptyDescription>
          </EmptyHeader>
          {verifiedHosts.length > 0 ? (
            <EmptyContent>
              <Button render={<Link to="/app/tests/new" />}>Create test</Button>
            </EmptyContent>
          ) : null}
        </Empty>
      ) : null}

      {!isError && (isPending || tests.length > 0) ? (
        <LoadTestsDataTable
          orgId={orgId}
          tests={tests}
          hostNameById={hostNameById}
          isLoading={isPending}
          onDelete={(test) => {
            setDeleteTest(test);
            setDeleteOpen(true);
          }}
        />
      ) : null}

      <DeleteLoadTestDialog
        orgId={orgId}
        test={deleteTest}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}
