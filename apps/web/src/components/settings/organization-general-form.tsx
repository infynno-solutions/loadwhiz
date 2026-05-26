"use client";

import { Button } from "@loadwhiz/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@loadwhiz/ui/components/card";
import { Field, FieldGroup, FieldLabel } from "@loadwhiz/ui/components/field";
import { Input } from "@loadwhiz/ui/components/input";
import { Spinner } from "@loadwhiz/ui/components/spinner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  organizationsDeleteMutation,
  organizationsGetOptions,
  organizationsUpdateMutation,
  usersMeOptions,
  usersMeQueryKey,
} from "@/api/generated/@tanstack/react-query.gen";
import { DeleteOrganizationDialog } from "@/components/settings/delete-organization-dialog";
import { getApiErrorMessage } from "@/lib/api-errors";
import {
  canManageOrganization,
  isOrganizationOwner,
  needsOrganizationOnboarding,
  useCurrentUser,
} from "@/lib/user-queries";

type OrganizationGeneralFormProps = {
  orgId: string;
};

export function OrganizationGeneralForm({
  orgId,
}: OrganizationGeneralFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { data: organization, isPending } = useQuery(
    organizationsGetOptions({ path: { org_id: orgId } }),
  );
  const updateOrg = useMutation(organizationsUpdateMutation());
  const deleteOrg = useMutation(organizationsDeleteMutation());

  const [name, setName] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (organization) {
      setName(organization.name);
    }
  }, [organization]);

  const canManage = canManageOrganization(user);
  const isOwner = isOrganizationOwner(user);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      await updateOrg.mutateAsync({
        path: { org_id: orgId },
        body: { name: trimmed },
      });
      await queryClient.invalidateQueries({
        queryKey: organizationsGetOptions({ path: { org_id: orgId } }).queryKey,
      });
      await queryClient.invalidateQueries({ queryKey: usersMeQueryKey() });
      toast.success("Organization updated");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not update organization."));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteOrg.mutateAsync({ path: { org_id: orgId } });
      const me = await queryClient.fetchQuery({
        ...usersMeOptions(),
        staleTime: 0,
      });
      await router.invalidate();
      toast.success("Organization deleted");
      if (needsOrganizationOnboarding(me)) {
        await router.navigate({ to: "/app/onboarding", replace: true });
      } else {
        await router.navigate({ to: "/app/dashboard", replace: true });
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not delete organization."));
    }
  };

  if (isPending || !organization) {
    return <Spinner className="mx-auto size-6" />;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Organization name and identifier.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="org-settings-name">
                Organization name
              </FieldLabel>
              <Input
                id="org-settings-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!canManage || updateOrg.isPending}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="org-settings-slug">Slug</FieldLabel>
              <Input
                id="org-settings-slug"
                value={organization.slug}
                disabled
              />
            </Field>
            {canManage ? (
              <Button
                type="button"
                onClick={() => void handleSave()}
                disabled={
                  updateOrg.isPending || name.trim() === organization.name
                }
              >
                {updateOrg.isPending ? <Spinner /> : "Save changes"}
              </Button>
            ) : null}
          </FieldGroup>
        </CardContent>
      </Card>

      {isOwner ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive">Danger zone</CardTitle>
            <CardDescription>
              Permanently delete this organization and all associated data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            >
              Delete organization
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <DeleteOrganizationDialog
        organizationName={organization.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        isDeleting={deleteOrg.isPending}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
