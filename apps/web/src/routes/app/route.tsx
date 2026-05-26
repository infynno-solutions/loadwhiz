import { SidebarInset, SidebarProvider } from "@loadwhiz/ui/components/sidebar";
import {
  createFileRoute,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopBar } from "@/components/layout/app-top-bar";
import { isAuthenticated, requireAuth } from "@/lib/auth";
import { getServerSessionTokens } from "@/lib/auth-server";
import { hydrateSessionFromCookies } from "@/lib/auth-session";
import {
  APP_ONBOARDING_PATH,
  fetchCurrentUser,
  isAppOnboardingPath,
  needsOrganizationOnboarding,
} from "@/lib/user-queries";

function applyOrganizationOnboardingGuard(
  me: Awaited<ReturnType<typeof fetchCurrentUser>>,
  pathname: string,
) {
  const onOnboarding = isAppOnboardingPath(pathname);

  if (needsOrganizationOnboarding(me)) {
    if (!onOnboarding) {
      throw redirect({ to: APP_ONBOARDING_PATH, replace: true });
    }
    return;
  }

  if (onOnboarding) {
    throw redirect({ to: "/app/dashboard", replace: true });
  }
}

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
      applyOrganizationOnboardingGuard(me, location.pathname);
      return { me };
    }

    requireAuth(location);
    const me = await fetchCurrentUser(context.queryClient);
    applyOrganizationOnboardingGuard(me, location.pathname);
    return { me };
  },
  component: AppLayout,
});

function AppLayout() {
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const isOnboarding = isAppOnboardingPath(pathname);

  useEffect(() => {
    hydrateSessionFromCookies();
    if (!isAuthenticated()) {
      navigate({
        to: "/login",
        search: { redirect: window.location.href },
      });
    }
  }, [navigate]);

  if (isOnboarding) {
    return <Outlet />;
  }

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
