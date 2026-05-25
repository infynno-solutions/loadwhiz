import { useQuery } from "@tanstack/react-query";

import {
  hostsListOptions,
  hostsListQueryKey,
} from "@/api/generated/@tanstack/react-query.gen";

export function hostsListQueryKeyForOrg(orgId: string) {
  return hostsListQueryKey({ path: { org_id: orgId } });
}

export function useHostsList(orgId: string | undefined) {
  return useQuery({
    ...hostsListOptions({
      path: { org_id: orgId ?? "" },
    }),
    enabled: Boolean(orgId),
  });
}

export function formatHostDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
