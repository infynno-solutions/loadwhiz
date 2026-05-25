import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireAuth } from "@/lib/auth";

export const Route = createFileRoute("/app")({
  beforeLoad: ({ location }) => {
    requireAuth(location);
  },
  component: AppLayout,
});

function AppLayout() {
  return <Outlet />;
}
