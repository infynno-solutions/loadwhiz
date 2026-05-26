import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  onboardingCompleteOrganizationMutation,
  organizationsCreateMutation,
  usersMeOptions,
  usersSetActiveOrganizationMutation,
} from "@/api/generated/@tanstack/react-query.gen";
import type { UserMeResponse } from "@/api/generated/types.gen";
import { getApiErrorMessage } from "@/lib/api-errors";
import { needsOrganizationOnboarding } from "@/lib/user-queries";

type UseCreateOrganizationOptions = {
  user: UserMeResponse | undefined;
  onSuccess?: () => void;
};

export function useCreateOrganization({
  user,
  onSuccess,
}: UseCreateOrganizationOptions) {
  const queryClient = useQueryClient();
  const setActiveOrg = useMutation(usersSetActiveOrganizationMutation());
  const createOrg = useMutation(organizationsCreateMutation());
  const completeOnboarding = useMutation(
    onboardingCompleteOrganizationMutation(),
  );

  const createOrganization = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    try {
      if (user && needsOrganizationOnboarding(user)) {
        const result = await completeOnboarding.mutateAsync({
          body: { name: trimmed },
        });
        if (result.organization.id !== user.active_organization_id) {
          await setActiveOrg.mutateAsync({
            body: { organization_id: result.organization.id },
          });
        }
      } else {
        const created = await createOrg.mutateAsync({
          body: { name: trimmed },
        });
        if (created?.id && created.id !== user?.active_organization_id) {
          await setActiveOrg.mutateAsync({
            body: { organization_id: created.id },
          });
        }
      }

      await queryClient.fetchQuery({
        ...usersMeOptions(),
        staleTime: 0,
      });
      onSuccess?.();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not create organization."));
    }
  };

  const isPending =
    createOrg.isPending ||
    completeOnboarding.isPending ||
    setActiveOrg.isPending;

  return { createOrganization, isPending };
}
