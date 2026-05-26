import { useQuery } from "@tanstack/react-query";
import { organizationsDashboardOptions } from "@/api/generated/@tanstack/react-query.gen";

export function useOrgDashboard(orgId: string | undefined) {
  return useQuery({
    ...organizationsDashboardOptions({
      path: { org_id: orgId ?? "" },
    }),
    enabled: Boolean(orgId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.stats.active_runs && data.stats.active_runs > 0) {
        return 5_000;
      }
      return false;
    },
  });
}
