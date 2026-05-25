import { useMatches, useRouterState } from "@tanstack/react-router";

import { getBreadcrumbForPathname } from "@/lib/app-navigation";

export type AppBreadcrumbItem = {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
};

export function useAppBreadcrumbs(): AppBreadcrumbItem[] {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const matches = useMatches();

  const routeCrumbs = matches.flatMap((match) => {
    const label = match.staticData?.breadcrumb;
    if (!label) return [];
    return [{ label: String(label), href: match.pathname }];
  });

  if (routeCrumbs.length === 0) {
    const fallback = getBreadcrumbForPathname(pathname);
    if (fallback) {
      routeCrumbs.push({ label: fallback, href: pathname });
    }
  }

  return routeCrumbs.map((crumb, index) => {
    const isLast = index === routeCrumbs.length - 1;
    return {
      label: crumb.label,
      href: isLast ? undefined : crumb.href,
      isCurrentPage: isLast,
    };
  });
}
