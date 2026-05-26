import { useMatches, useRouterState } from "@tanstack/react-router";

import { APP_NAV_ITEMS, getBreadcrumbForPathname } from "@/lib/app-navigation";

export type AppBreadcrumbItem = {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
};

type RouteCrumb = {
  label: string;
  href: string;
};

function normalizePathname(pathname: string) {
  return pathname.length > 1 && pathname.endsWith("/")
    ? pathname.slice(0, -1)
    : pathname;
}

function dedupeConsecutiveCrumbs(crumbs: RouteCrumb[]) {
  return crumbs.filter(
    (crumb, index) => index === 0 || crumb.label !== crumbs[index - 1]?.label,
  );
}

function prependSectionCrumb(pathname: string, crumbs: RouteCrumb[]) {
  const normalized = normalizePathname(pathname);

  for (const item of APP_NAV_ITEMS) {
    const sectionPath = normalizePathname(item.to);
    const isSectionRoot =
      normalized === sectionPath || normalized === `${sectionPath}/`;
    const isNested = normalized.startsWith(`${sectionPath}/`);

    if (!isNested || isSectionRoot) continue;
    if (crumbs.some((crumb) => crumb.label === item.breadcrumb)) continue;

    return [{ label: item.breadcrumb, href: item.to }, ...crumbs];
  }

  return crumbs;
}

export function useAppBreadcrumbs(): AppBreadcrumbItem[] {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const matches = useMatches();
  const leafMatch = matches.at(-1);

  const routeCrumbs = matches.flatMap((match) => {
    const staticLabel = match.staticData?.breadcrumb;
    if (staticLabel) {
      return [{ label: String(staticLabel), href: match.pathname }];
    }

    const isLeaf = match === leafMatch;
    const dynamic = (match.context as { breadcrumb?: string } | undefined)
      ?.breadcrumb;
    if (!dynamic) return [];

    // Layout routes expose dynamic labels; leaf routes only when they have no static label.
    if (!isLeaf || !staticLabel) {
      return [{ label: String(dynamic), href: match.pathname }];
    }

    return [];
  });

  let crumbs = dedupeConsecutiveCrumbs(routeCrumbs);

  if (crumbs.length === 0) {
    const fallback = getBreadcrumbForPathname(pathname);
    if (fallback) {
      crumbs = [{ label: fallback, href: pathname }];
    }
  }

  crumbs = prependSectionCrumb(pathname, crumbs);

  return crumbs.map((crumb, index) => {
    const isLast = index === crumbs.length - 1;
    return {
      label: crumb.label,
      href: isLast ? undefined : crumb.href,
      isCurrentPage: isLast,
    };
  });
}
