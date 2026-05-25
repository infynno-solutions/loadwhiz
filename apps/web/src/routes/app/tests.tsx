import { createFileRoute } from "@tanstack/react-router";
import { useActiveOrganization, useCurrentUser } from "@/lib/user-queries";

export const Route = createFileRoute("/app/tests")({
  staticData: {
    breadcrumb: "Load tests",
  },
  component: TestsPage,
});

function TestsPage() {
  const { data: user } = useCurrentUser();
  const activeOrg = useActiveOrganization(user);

  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-semibold text-xl">Load tests</h1>
      <p className="text-muted-foreground text-sm">
        Create and manage load test configurations for verified hosts. Load test
        APIs are scoped to your active organization
        {activeOrg ? ` (${activeOrg.name})` : ""}.
      </p>
    </div>
  );
}
