import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@loadwhiz/ui/components/sidebar";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  FlaskConicalIcon,
  GaugeIcon,
  ServerIcon,
  SettingsIcon,
} from "lucide-react";

import { APP_NAV_ITEMS } from "@/lib/app-navigation";

const navItems = [
  { ...APP_NAV_ITEMS[0], icon: GaugeIcon },
  { ...APP_NAV_ITEMS[1], icon: ServerIcon },
  { ...APP_NAV_ITEMS[2], icon: FlaskConicalIcon },
  { ...APP_NAV_ITEMS[3], icon: SettingsIcon },
] as const;

export function NavMain() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {navItems.map((item) => {
          const isActive =
            pathname === item.to || pathname.startsWith(`${item.to}/`);
          return (
            <SidebarMenuItem key={item.to}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={isActive}
                render={<Link to={item.to} />}
              >
                <item.icon />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
