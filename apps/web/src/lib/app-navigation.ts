export const APP_NAV_ITEMS = [
  {
    title: "Dashboard",
    to: "/app/dashboard",
    breadcrumb: "Dashboard",
  },
  {
    title: "Hosts",
    to: "/app/hosts",
    breadcrumb: "Hosts",
  },
  {
    title: "Load tests",
    to: "/app/tests",
    breadcrumb: "Load tests",
  },
  {
    title: "Settings",
    to: "/app/settings",
    breadcrumb: "Settings",
  },
] as const;

export type AppNavItem = (typeof APP_NAV_ITEMS)[number];

export function getBreadcrumbForPathname(pathname: string): string | undefined {
  const match = APP_NAV_ITEMS.find(
    (item) => pathname === item.to || pathname.startsWith(`${item.to}/`),
  );
  return match?.breadcrumb;
}
