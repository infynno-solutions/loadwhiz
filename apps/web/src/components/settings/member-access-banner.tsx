import { canManageOrganization, useCurrentUser } from "@/lib/user-queries";

export function MemberAccessBanner() {
  const { data: user } = useCurrentUser();

  if (!user || canManageOrganization(user)) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm">
      You have member access. Contact an owner or admin to manage this
      organization.
    </div>
  );
}
