"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import {
  organizationsMembersListOptions,
  organizationsMembersRemoveMutation,
  organizationsMembersUpdateRoleMutation,
} from "@/api/generated/@tanstack/react-query.gen";
import type { MemberResponse } from "@/api/generated/types.gen";
import { MemberAccessBanner } from "@/components/settings/member-access-banner";
import { MembersDataTable } from "@/components/settings/members-data-table";
import { NoActiveOrganization } from "@/components/settings/no-active-organization";
import { RemoveMemberDialog } from "@/components/settings/remove-member-dialog";
import { SettingsPageHeader } from "@/components/settings/settings-page-header";
import { useActiveOrgId } from "@/hooks/use-active-org-id";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  canChangeMemberRoles,
  canManageOrganization,
} from "@/lib/user-queries";

export const Route = createFileRoute("/app/settings/organization/members")({
  staticData: {
    breadcrumb: "Members",
  },
  component: OrganizationMembersPage,
});

function OrganizationMembersPage() {
  const { orgId, user, isPending: isUserPending } = useActiveOrgId();
  const queryClient = useQueryClient();
  const { data: members = [], isPending } = useQuery({
    ...organizationsMembersListOptions({
      path: { org_id: orgId ?? "" },
    }),
    enabled: Boolean(orgId),
  });

  const updateRole = useMutation(organizationsMembersUpdateRoleMutation());
  const removeMember = useMutation(organizationsMembersRemoveMutation());

  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<MemberResponse | null>(
    null,
  );
  const [removeOpen, setRemoveOpen] = useState(false);

  const invalidateMembers = async () => {
    if (!orgId) return;
    await queryClient.invalidateQueries({
      queryKey: organizationsMembersListOptions({ path: { org_id: orgId } })
        .queryKey,
    });
  };

  const handleRoleChange = async (
    member: MemberResponse,
    role: "admin" | "member",
  ) => {
    if (!orgId) return;
    setActionUserId(member.user_id);
    try {
      await updateRole.mutateAsync({
        path: { org_id: orgId, user_id: member.user_id },
        body: { role },
      });
      await invalidateMembers();
      toast.success("Member role updated");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not update member role."));
    } finally {
      setActionUserId(null);
    }
  };

  const handleRemove = async () => {
    if (!orgId || !memberToRemove) return;
    setActionUserId(memberToRemove.user_id);
    try {
      await removeMember.mutateAsync({
        path: { org_id: orgId, user_id: memberToRemove.user_id },
      });
      await invalidateMembers();
      toast.success("Member removed");
      setRemoveOpen(false);
      setMemberToRemove(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not remove member."));
    } finally {
      setActionUserId(null);
    }
  };

  if (isUserPending) {
    return null;
  }

  if (!orgId || !user) {
    return (
      <div className="flex flex-col gap-6">
        <SettingsPageHeader
          title="Members"
          description="Manage who has access to this organization."
        />
        <NoActiveOrganization />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <SettingsPageHeader
        title="Members"
        description="Manage who has access to this organization."
      />
      <MemberAccessBanner />
      <MembersDataTable
        members={members}
        isLoading={isPending}
        meta={{
          currentUserId: user.id,
          canChangeRoles: canChangeMemberRoles(user),
          canRemoveMembers: canManageOrganization(user),
          onRoleChange: (member, role) => void handleRoleChange(member, role),
          onRemove: (member) => {
            setMemberToRemove(member);
            setRemoveOpen(true);
          },
          actionUserId,
        }}
      />
      <RemoveMemberDialog
        member={memberToRemove}
        open={removeOpen}
        onOpenChange={setRemoveOpen}
        isRemoving={removeMember.isPending}
        onConfirm={() => void handleRemove()}
      />
    </div>
  );
}
