import { createFileRoute } from "@tanstack/react-router";
import { useActiveOrganization, useCurrentUser } from "@/lib/user-queries";

export const Route = createFileRoute("/app/hosts")({
  staticData: {
    breadcrumb: "Hosts",
  },
  component: HostsPage,
});

function HostsPage() {
  const { data: user } = useCurrentUser();
  const activeOrg = useActiveOrganization(user);

  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-semibold text-xl">Hosts</h1>
      <p className="text-muted-foreground text-sm">
        Register and verify domains used as load test targets. Host APIs are
        scoped to your active organization
        {activeOrg ? ` (${activeOrg.name})` : ""}.
      </p>
    </div>
  );
}
