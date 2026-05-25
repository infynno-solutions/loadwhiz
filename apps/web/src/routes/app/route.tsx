import { SidebarInset, SidebarProvider } from "@loadwhiz/ui/components/sidebar";
import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopBar } from "@/components/layout/app-top-bar";
import { isAuthenticated, requireAuth } from "@/lib/auth";
import { getServerSessionTokens } from "@/lib/auth-server";
import { hydrateSessionFromCookies } from "@/lib/auth-session";
import { fetchCurrentUser } from "@/lib/user-queries";

export const Route = createFileRoute("/app")({
  beforeLoad: async ({ location, context }) => {
    if (typeof window === "undefined") {
      const { accessToken } = await getServerSessionTokens();
      if (!accessToken) {
        throw redirect({
          to: "/login",
          search: { redirect: location.href },
        });
      }
      const me = await fetchCurrentUser(context.queryClient, accessToken);
      return { me };
    }

    requireAuth(location);
    const me = await fetchCurrentUser(context.queryClient);
    return { me };
  },
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    hydrateSessionFromCookies();
    if (!isAuthenticated()) {
      navigate({
        to: "/login",
        search: { redirect: window.location.href },
      });
    }
  }, [navigate]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppTopBar />
        <div className="flex flex-1 flex-col overflow-y-auto p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
