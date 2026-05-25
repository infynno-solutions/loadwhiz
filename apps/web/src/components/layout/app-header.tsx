"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@loadwhiz/ui/components/breadcrumb";
import { Separator } from "@loadwhiz/ui/components/separator";
import { SidebarTrigger } from "@loadwhiz/ui/components/sidebar";
import { Link } from "@tanstack/react-router";
import { Fragment } from "react";
import { NavUser } from "@/components/layout/nav-user";
import { useAppBreadcrumbs } from "@/hooks/use-app-breadcrumbs";

export function AppHeader() {
  const breadcrumbs = useAppBreadcrumbs();

  return (
    <header className="flex h-14 shrink-0 items-stretch border-b">
      <div className="flex items-center px-3">
        <SidebarTrigger className="-ml-1" />
      </div>
      <Separator orientation="vertical" />
      <div className="flex min-w-0 flex-1 items-center px-3">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <Fragment key={`${crumb.label}-${index}`}>
                {index > 0 ? <BreadcrumbSeparator /> : null}
                <BreadcrumbItem>
                  {crumb.isCurrentPage || !crumb.href ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink render={<Link to={crumb.href} />}>
                      {crumb.label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center px-3">
        <NavUser />
      </div>
    </header>
  );
}
