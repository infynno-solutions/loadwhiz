"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@loadwhiz/ui/components/select";
import { cn } from "@loadwhiz/ui/lib/utils";
import { Link, useRouterState } from "@tanstack/react-router";
import { Building2Icon, MonitorIcon, ShieldIcon, UserIcon } from "lucide-react";

const accountItems = [
  {
    title: "Account",
    to: "/app/settings/account",
    icon: UserIcon,
    description: "Profile and email",
  },
  {
    title: "Appearance",
    to: "/app/settings/appearance",
    icon: MonitorIcon,
    description: "Theme preferences",
  },
  {
    title: "Security",
    to: "/app/settings/security",
    icon: ShieldIcon,
    description: "Password and access",
  },
] as const;

const organizationItems = [
  {
    title: "General",
    to: "/app/settings/organization",
    icon: Building2Icon,
    description: "Organization details",
  },
  {
    title: "Members",
    to: "/app/settings/organization/members",
    icon: UserIcon,
    description: "Team access",
  },
  {
    title: "Invitations",
    to: "/app/settings/organization/invitations",
    icon: UserIcon,
    description: "Pending invites",
  },
] as const;

const allItems = [...accountItems, ...organizationItems];

function isNavItemActive(itemTo: string, pathname: string) {
  if (itemTo === "/app/settings/organization") {
    return pathname === "/app/settings/organization";
  }
  return pathname === itemTo || pathname.startsWith(`${itemTo}/`);
}

function NavLink({
  item,
  pathname,
}: {
  item: (typeof allItems)[number];
  pathname: string;
}) {
  const isActive = isNavItemActive(item.to, pathname);

  return (
    <Link
      to={item.to}
      className={cn(
        "flex flex-col gap-0.5 rounded-lg border px-3 py-2 text-sm transition-colors",
        isActive
          ? "border-border bg-muted font-medium"
          : "border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      <span className="flex items-center gap-2">
        <item.icon className="size-4 shrink-0" />
        {item.title}
      </span>
      <span className="pl-6 text-xs">{item.description}</span>
    </Link>
  );
}

export function SettingsNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex flex-col gap-6">
      <div className="md:hidden">
        <Select
          value={
            allItems.find((item) => isNavItemActive(item.to, pathname))?.to ??
            "/app/settings/account"
          }
          onValueChange={(value) => {
            if (value) {
              window.location.href = value;
            }
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Settings section" />
          </SelectTrigger>
          <SelectContent>
            {allItems.map((item) => (
              <SelectItem key={item.to} value={item.to}>
                {item.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="hidden flex-col gap-6 md:flex">
        <div className="flex flex-col gap-1">
          <p className="px-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
            Account
          </p>
          <div className="flex flex-col gap-1">
            {accountItems.map((item) => (
              <NavLink key={item.to} item={item} pathname={pathname} />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <p className="px-1 font-medium text-muted-foreground text-xs uppercase tracking-wide">
            Organization
          </p>
          <div className="flex flex-col gap-1">
            {organizationItems.map((item) => (
              <NavLink key={item.to} item={item} pathname={pathname} />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
