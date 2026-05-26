import { createFileRoute, Outlet } from "@tanstack/react-router";

import { SettingsNav } from "@/components/settings/settings-nav";

export const Route = createFileRoute("/app/settings")({
  staticData: {
    breadcrumb: "Settings",
  },
  component: SettingsLayout,
});

function SettingsLayout() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 lg:flex-row lg:items-start">
      <aside className="w-full shrink-0 lg:w-64">
        <SettingsNav />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <Outlet />
      </div>
    </div>
  );
}
