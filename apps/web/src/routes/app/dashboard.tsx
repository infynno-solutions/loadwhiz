import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/dashboard")({
  staticData: {
    breadcrumb: "Dashboard",
  },
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-semibold text-xl">Dashboard</h1>
      <p className="text-muted-foreground text-sm">
        Welcome to LoadWhiz. Use the sidebar to manage hosts and load tests.
      </p>
    </div>
  );
}
