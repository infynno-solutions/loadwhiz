"use client";

import { Button } from "@loadwhiz/ui/components/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@loadwhiz/ui/components/sheet";
import { cn } from "@loadwhiz/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { HiBars3 } from "react-icons/hi2";
import { SiGithub } from "react-icons/si";

import {
  LANDING_GITHUB_URL,
  LANDING_NAV,
} from "@/components/landing/landing-constants";
import { useLandingAuth } from "@/components/landing/use-landing-auth";

function NavAnchor({
  href,
  children,
  onClick,
  className,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("h-10 min-h-11", className)}
      nativeButton={false}
      render={<a href={href} onClick={onClick} />}
    >
      {children}
    </Button>
  );
}

function HeaderActions({
  authed,
  className,
  onNavigate,
}: {
  authed: boolean;
  className?: string;
  onNavigate?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-center",
        className,
      )}
    >
      <Button
        variant="ghost"
        size="sm"
        className="h-10 gap-2"
        nativeButton={false}
        render={
          <a
            href={LANDING_GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onNavigate}
          />
        }
      >
        <SiGithub className="size-4" aria-hidden />
        GitHub
      </Button>
      {authed ? (
        <Button
          size="sm"
          className="h-10"
          render={<Link to="/app/dashboard" onClick={onNavigate} />}
        >
          Go to dashboard
        </Button>
      ) : (
        <>
          <Button
            variant="ghost"
            size="sm"
            className="h-10"
            render={<Link to="/login" onClick={onNavigate} />}
          >
            Log in
          </Button>
          <Button
            size="sm"
            className="h-10"
            render={<Link to="/signup" onClick={onNavigate} />}
          >
            Sign up
          </Button>
        </>
      )}
    </div>
  );
}

export function LandingHeader() {
  const authed = useLandingAuth();
  const [open, setOpen] = useState(false);

  const closeSheet = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>
      <div
        className="mx-auto w-full max-w-6xl px-4 sm:px-6 flex h-16 items-center justify-between gap-4"
      >
        <Button
          variant="ghost"
          size="sm"
          className="font-semibold text-base"
          nativeButton={false}
          render={<a href="#top">LoadWhiz</a>}
        />

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Primary"
        >
          {LANDING_NAV.map((item) => (
            <NavAnchor key={item.href} href={item.href}>
              {item.label}
            </NavAnchor>
          ))}
        </nav>

        <HeaderActions authed={authed} className="hidden md:flex" />

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                className="size-11 md:hidden"
                aria-label="Open menu"
              />
            }
          >
            <HiBars3 className="size-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-xs">
            <SheetHeader>
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <nav
              className="flex flex-col gap-1 px-4"
              aria-label="Mobile primary"
            >
              {LANDING_NAV.map((item) => (
                <SheetClose
                  key={item.href}
                  render={
                    <NavAnchor
                      href={item.href}
                      onClick={closeSheet}
                      className="w-full justify-start"
                    >
                      {item.label}
                    </NavAnchor>
                  }
                />
              ))}
            </nav>
            <div className="flex flex-col gap-2 px-4 pb-4">
              <HeaderActions authed={authed} onNavigate={closeSheet} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
