import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
} from "@loadwhiz/ui/components/sidebar";
import type * as React from "react";

import { NavMain } from "@/components/layout/nav-main";
import { OrgSwitcher } from "@/components/layout/org-switcher";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <OrgSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
