"use client";

import { Button } from "@loadwhiz/ui/components/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@loadwhiz/ui/components/empty";
import { Spinner } from "@loadwhiz/ui/components/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@loadwhiz/ui/components/table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import {
  organizationsInvitesListOptions,
  organizationsInvitesRevokeMutation,
} from "@/api/generated/@tanstack/react-query.gen";
import type { InviteResponse } from "@/api/generated/types.gen";
import { InviteMemberSheet } from "@/components/settings/invite-member-sheet";
import { MemberAccessBanner } from "@/components/settings/member-access-banner";
import { NoActiveOrganization } from "@/components/settings/no-active-organization";
import { RoleBadge } from "@/components/settings/role-badge";
import { SettingsPageHeader } from "@/components/settings/settings-page-header";
import { useActiveOrgId } from "@/hooks/use-active-org-id";
import { getApiErrorMessage } from "@/lib/api-errors";
import { canManageOrganization } from "@/lib/user-queries";

export const Route = createFileRoute("/app/settings/organization/invitations")({
  staticData: {
    breadcrumb: "Invitations",
  },
  component: OrganizationInvitationsPage,
});

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function OrganizationInvitationsPage() {
  const { orgId, user, isPending: isUserPending } = useActiveOrgId();
  const queryClient = useQueryClient();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const { data: invites = [], isPending } = useQuery({
    ...organizationsInvitesListOptions({
      path: { org_id: orgId ?? "" },
    }),
    enabled: Boolean(orgId) && canManageOrganization(user),
  });

  const revokeInvite = useMutation(organizationsInvitesRevokeMutation());

  const handleRevoke = async (invite: InviteResponse) => {
    if (!orgId) return;
    setRevokingId(invite.id);
    try {
      await revokeInvite.mutateAsync({
        path: { org_id: orgId, invite_id: invite.id },
      });
      await queryClient.invalidateQueries({
        queryKey: organizationsInvitesListOptions({ path: { org_id: orgId } })
          .queryKey,
      });
      toast.success("Invitation revoked");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not revoke invitation."));
    } finally {
      setRevokingId(null);
    }
  };

  if (isUserPending) {
    return null;
  }

  if (!orgId || !user) {
    return (
      <div className="flex flex-col gap-6">
        <SettingsPageHeader
          title="Invitations"
          description="Invite teammates to join this organization."
        />
        <NoActiveOrganization />
      </div>
    );
  }

  const canManage = canManageOrganization(user);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SettingsPageHeader
          title="Invitations"
          description="Invite teammates to join this organization."
        />
        {canManage ? (
          <Button type="button" onClick={() => setInviteOpen(true)}>
            Invite member
          </Button>
        ) : null}
      </div>
      <MemberAccessBanner />

      {!canManage ? (
        <p className="text-muted-foreground text-sm">
          Only owners and admins can view pending invitations.
        </p>
      ) : isPending ? (
        <Spinner className="mx-auto size-6" />
      ) : invites.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyTitle>No pending invitations</EmptyTitle>
            <EmptyDescription>
              Invite teammates by email to collaborate in this organization.
            </EmptyDescription>
          </EmptyHeader>
          {canManage ? (
            <EmptyContent>
              <Button onClick={() => setInviteOpen(true)}>Invite member</Button>
            </EmptyContent>
          ) : null}
        </Empty>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="w-24">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell>{invite.email}</TableCell>
                  <TableCell>
                    <RoleBadge role={invite.role} />
                  </TableCell>
                  <TableCell className="capitalize">{invite.status}</TableCell>
                  <TableCell>{formatDate(invite.expires_at)}</TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={revokingId === invite.id}
                      onClick={() => void handleRevoke(invite)}
                    >
                      {revokingId === invite.id ? (
                        <Spinner className="size-4" />
                      ) : (
                        "Revoke"
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <InviteMemberSheet
        orgId={orgId}
        open={inviteOpen}
        onOpenChange={setInviteOpen}
      />
    </div>
  );
}
