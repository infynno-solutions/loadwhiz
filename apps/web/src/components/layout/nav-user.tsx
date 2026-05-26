"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@loadwhiz/ui/components/avatar";
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
import { Spinner } from "@loadwhiz/ui/components/spinner";
import { Link, useNavigate } from "@tanstack/react-router";
import { LogOutIcon, MonitorIcon, UserIcon } from "lucide-react";

import { signOut } from "@/lib/auth-api";
import { getInitials, useCurrentUser } from "@/lib/user-queries";

export function NavUser() {
  const navigate = useNavigate();
  const { data: user, isPending } = useCurrentUser();

  if (isPending || !user) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="size-8 rounded-full"
        disabled
        aria-label="Loading user menu"
      >
        <Spinner className="size-3.5" />
      </Button>
    );
  }

  const initials = getInitials(user.name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-full"
            aria-label="Open user menu"
          />
        }
      >
        <Avatar className="size-7">
          <AvatarImage src="" alt={user.name} />
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="min-w-56 rounded-lg"
        align="end"
        side="bottom"
        sideOffset={8}
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="p-0 font-normal">
            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar>
                <AvatarImage src="" alt={user.name} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.name}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link to="/app/settings/account" />}>
          <UserIcon />
          Account settings
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link to="/app/settings/appearance" />}>
          <MonitorIcon />
          Appearance
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await signOut();
            navigate({ to: "/login" });
          }}
        >
          <LogOutIcon />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
