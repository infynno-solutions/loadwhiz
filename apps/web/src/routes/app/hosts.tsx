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
import { createFileRoute } from "@tanstack/react-router";
import { Building2Icon, ServerIcon } from "lucide-react";
import { useState } from "react";
import type { HostResponse } from "@/api/generated/types.gen";
import { CreateHostSheet } from "@/components/hosts/create-host-sheet";
import { DeleteHostDialog } from "@/components/hosts/delete-host-dialog";
import { HostDetailSheet } from "@/components/hosts/host-detail-sheet";
import { HostsDataTable } from "@/components/hosts/hosts-data-table";
import { HostsToolbar } from "@/components/hosts/hosts-toolbar";
import { useHostsList } from "@/lib/host-queries";
import { useCurrentUser } from "@/lib/user-queries";

export const Route = createFileRoute("/app/hosts")({
  staticData: {
    breadcrumb: "Hosts",
  },
  component: HostsPage,
});

function HostsPage() {
  const { data: user } = useCurrentUser();
  const orgId = user?.active_organization_id;

  const { data: hosts = [], isPending, isError, refetch } = useHostsList(orgId);

  const [createOpen, setCreateOpen] = useState(false);
  const [detailHostId, setDetailHostId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteHost, setDeleteHost] = useState<HostResponse | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const openDetail = (host: HostResponse) => {
    setDetailHostId(host.id);
    setDetailOpen(true);
  };

  const openDelete = (host: HostResponse) => {
    setDeleteHost(host);
    setDeleteOpen(true);
  };

  if (!orgId) {
    return (
      <div className="flex flex-col gap-6">
        <HostsToolbar onAddHost={() => {}} disabled />
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Building2Icon />
            </EmptyMedia>
            <EmptyTitle>No active organization</EmptyTitle>
            <EmptyDescription>
              Select or create an organization in the sidebar to manage hosts.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <HostsToolbar onAddHost={() => setCreateOpen(true)} />

      {isError ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>Could not load hosts</EmptyTitle>
            <EmptyDescription>
              Something went wrong while fetching hosts for this organization.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button variant="outline" onClick={() => void refetch()}>
              Try again
            </Button>
          </EmptyContent>
        </Empty>
      ) : null}

      {!isError && !isPending && hosts.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ServerIcon />
            </EmptyMedia>
            <EmptyTitle>No hosts yet</EmptyTitle>
            <EmptyDescription>
              Register a domain to verify ownership before running load tests
              against it.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setCreateOpen(true)}>Add host</Button>
          </EmptyContent>
        </Empty>
      ) : null}

      {!isError && (isPending || hosts.length > 0) ? (
        <HostsDataTable
          orgId={orgId}
          hosts={hosts}
          isLoading={isPending}
          onView={openDetail}
          onDelete={openDelete}
        />
      ) : null}

      <CreateHostSheet
        orgId={orgId}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <HostDetailSheet
        orgId={orgId}
        hostId={detailHostId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <DeleteHostDialog
        host={deleteHost}
        orgId={orgId}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => setDeleteHost(null)}
      />
    </div>
  );
}
