import { useCurrentUser } from "@/lib/user-queries";

export function useActiveOrgId() {
  const { data: user, isPending } = useCurrentUser();
  return {
    orgId: user?.active_organization_id,
    isPending,
    user,
  };
}
