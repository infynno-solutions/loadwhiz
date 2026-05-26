"use client";

import { Button } from "@loadwhiz/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@loadwhiz/ui/components/dropdown-menu";
import { Input } from "@loadwhiz/ui/components/input";
import { Label } from "@loadwhiz/ui/components/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@loadwhiz/ui/components/sheet";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@loadwhiz/ui/components/sidebar";
import { Spinner } from "@loadwhiz/ui/components/spinner";
import { useMutation } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Building2Icon, ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { usersSetActiveOrganizationMutation } from "@/api/generated/@tanstack/react-query.gen";
import { getApiErrorMessage } from "@/lib/api-errors";
import { useCreateOrganization } from "@/lib/use-create-organization";
import {
  APP_ONBOARDING_PATH,
  getInitials,
  isActiveOrganizationReady,
  needsOrganizationOnboarding,
  reloadAppAfterOrganizationChange,
  useActiveOrganization,
  useCurrentUser,
} from "@/lib/user-queries";

export function OrgSwitcher() {
  const { isMobile } = useSidebar();
  const { data: user, isPending, isFetching } = useCurrentUser();
  const activeOrg = useActiveOrganization(user);
  const isOrgReady = isActiveOrganizationReady(user);

  const [createOpen, setCreateOpen] = useState(false);
  const [orgName, setOrgName] = useState("");

  const setActiveOrg = useMutation(usersSetActiveOrganizationMutation());
  const { createOrganization, isPending: isCreatingOrg } =
    useCreateOrganization({
      user,
      onSuccess: () => {
        setCreateOpen(false);
        setOrgName("");
        reloadAppAfterOrganizationChange();
      },
    });

  const organizations = user?.organizations ?? [];
  const needsOnboarding = needsOrganizationOnboarding(user);

  const handleSelectOrg = async (organizationId: string) => {
    if (organizationId === user?.active_organization_id) return;

    try {
      await setActiveOrg.mutateAsync({
        body: { organization_id: organizationId },
      });
      reloadAppAfterOrganizationChange();
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not switch organization."));
    }
  };

  const handleCreateOrg = () => {
    void createOrganization(orgName);
  };

  const isCreating = isCreatingOrg || setActiveOrg.isPending;

  const showLoading =
    isPending ||
    setActiveOrg.isPending ||
    ((user?.organizations.length ?? 0) > 0 &&
      (!isOrgReady || (isFetching && !isOrgReady)));

  if (showLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" disabled>
            <Spinner className="size-4" />
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  if (needsOnboarding) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            render={<Link to={APP_ONBOARDING_PATH} />}
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Building2Icon className="size-4" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">Set up organization</span>
              <span className="truncate text-xs">Required to continue</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const displayName = activeOrg?.name ?? "No organization";
  const displayRole = activeOrg?.role ?? "Select an organization";

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <SidebarMenuButton
                  size="lg"
                  className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
                />
              }
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                {activeOrg ? (
                  <span className="font-medium text-xs">
                    {getInitials(activeOrg.name)}
                  </span>
                ) : (
                  <Building2Icon className="size-4" />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs capitalize">
                  {displayRole}
                </span>
              </div>
              <ChevronsUpDownIcon className="ml-auto" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="min-w-56 rounded-lg"
              align="start"
              side={isMobile ? "bottom" : "right"}
              sideOffset={4}
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-muted-foreground text-xs">
                  Organizations
                </DropdownMenuLabel>
                {organizations.map((org) => (
                  <DropdownMenuItem
                    key={org.id}
                    onClick={() => handleSelectOrg(org.id)}
                    className="gap-2 p-2"
                    disabled={setActiveOrg.isPending}
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border font-medium text-xs">
                      {getInitials(org.name)}
                    </div>
                    <div className="flex flex-col">
                      <span>{org.name}</span>
                      <span className="text-muted-foreground text-xs capitalize">
                        {org.role}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="gap-2 p-2"
                  render={<Link to="/app/settings/organization" />}
                >
                  <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                    <Building2Icon className="size-4" />
                  </div>
                  <div className="font-medium text-muted-foreground">
                    Manage organization
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2 p-2"
                  onClick={() => setCreateOpen(true)}
                >
                  <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                    <PlusIcon className="size-4" />
                  </div>
                  <div className="font-medium text-muted-foreground">
                    Add organization
                  </div>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Create organization</SheetTitle>
            <SheetDescription>
              Add a new organization workspace for your team.
            </SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-2 px-4">
            <Label htmlFor="org-name">Organization name</Label>
            <Input
              id="org-name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Acme Inc"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void handleCreateOrg();
                }
              }}
            />
          </div>
          <SheetFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button onClick={() => handleCreateOrg()} disabled={isCreating}>
              {isCreating ? <Spinner /> : "Create"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
