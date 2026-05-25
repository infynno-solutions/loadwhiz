import type { QueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import {
  usersMeOptions,
  usersMeQueryKey,
} from "@/api/generated/@tanstack/react-query.gen";
import type {
  UserMeResponse,
  UserOrganizationSummary,
} from "@/api/generated/types.gen";

export { usersMeOptions, usersMeQueryKey };

const appRouteApi = getRouteApi("/app");

export async function fetchCurrentUser(
  queryClient: QueryClient,
  accessToken?: string | null,
) {
  return queryClient.fetchQuery({
    ...(accessToken ? usersMeOptions({ auth: accessToken }) : usersMeOptions()),
    staleTime: 0,
  });
}

/** Reload the app so org-scoped routes and queries refetch with the new active org. */
export function reloadAppAfterOrganizationChange() {
  if (typeof window === "undefined") return;
  window.location.reload();
}

export function isActiveOrganizationReady(
  user: UserMeResponse | undefined,
): boolean {
  if (!user) return false;
  if (user.organizations.length === 0) return true;
  if (!user.active_organization_id) return false;
  return user.organizations.some(
    (org) => org.id === user.active_organization_id,
  );
}

export function useCurrentUser() {
  const me = appRouteApi.useRouteContext({
    select: (ctx) => ctx.me,
  });

  return useQuery({
    ...usersMeOptions(),
    initialData: me,
    initialDataUpdatedAt: me ? Date.now() : undefined,
    refetchOnMount: false,
  });
}

export function useActiveOrganization(
  user: UserMeResponse | undefined,
): UserOrganizationSummary | undefined {
  if (!user?.active_organization_id) return undefined;
  return user.organizations.find(
    (org) => org.id === user.active_organization_id,
  );
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
