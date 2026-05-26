"use client";

import { Button } from "@loadwhiz/ui/components/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@loadwhiz/ui/components/empty";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";
import { CreateLoadTestForm } from "@/components/load-tests/create-load-test-form";
import { useVerifiedHosts } from "@/lib/load-test-queries";
import { useCurrentUser } from "@/lib/user-queries";

export const Route = createFileRoute("/app/tests/new")({
  staticData: {
    breadcrumb: "New test",
  },
  component: CreateLoadTestPage,
});

function CreateLoadTestPage() {
  const { data: user } = useCurrentUser();
  const orgId = user?.active_organization_id;
  const { data: verifiedHosts = [] } = useVerifiedHosts(orgId);

  if (!orgId) {
    return (
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>No active organization</EmptyTitle>
          <EmptyDescription>
            Select an organization in the sidebar to create a load test.
          </EmptyDescription>
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
        render={<Link to="/app/tests" />}
      >
        <ArrowLeftIcon />
        Back to load tests
      </Button>

      <div>
        <h1 className="font-semibold text-xl">Create load test</h1>
        <p className="mt-1 text-muted-foreground text-sm">
          Set up a load test configuration for a verified host. Choose how
          requests are defined, tune virtual clients and duration, then run from
          the test detail page when you are ready.
        </p>
      </div>

      <CreateLoadTestForm orgId={orgId} verifiedHosts={verifiedHosts} />
    </div>
  );
}
