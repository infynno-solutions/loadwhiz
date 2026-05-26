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

export function needsOrganizationOnboarding(
  user: UserMeResponse | undefined,
): boolean {
  if (!user) return false;
  return !user.onboarding_completed || user.organizations.length === 0;
}

export function isActiveOrganizationReady(
  user: UserMeResponse | undefined,
): boolean {
  if (!user) return false;
  if (user.organizations.length === 0) return false;
  if (!user.active_organization_id) return false;
  return user.organizations.some(
    (org) => org.id === user.active_organization_id,
  );
}

export const APP_ONBOARDING_PATH = "/app/onboarding";

export function isAppOnboardingPath(pathname: string): boolean {
  return (
    pathname === APP_ONBOARDING_PATH ||
    pathname.startsWith(`${APP_ONBOARDING_PATH}/`)
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

export type OrganizationRole = "owner" | "admin" | "member";

export function getActiveOrganizationRole(
  user: UserMeResponse | undefined,
): OrganizationRole | undefined {
  if (!user?.active_organization_id) return undefined;
  const org = user.organizations.find(
    (item) => item.id === user.active_organization_id,
  );
  if (!org) return undefined;
  return org.role as OrganizationRole;
}

export function isOrganizationOwner(user: UserMeResponse | undefined): boolean {
  return getActiveOrganizationRole(user) === "owner";
}

export function canManageOrganization(
  user: UserMeResponse | undefined,
): boolean {
  const role = getActiveOrganizationRole(user);
  return role === "owner" || role === "admin";
}

export function canChangeMemberRoles(
  user: UserMeResponse | undefined,
): boolean {
  return isOrganizationOwner(user);
}
