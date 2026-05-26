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
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { HiBars3, HiMoon, HiSun } from "react-icons/hi2";
import { SiGithub } from "react-icons/si";

import { AppLogo } from "@/components/app-logo";
import { LandingBrandButton } from "@/components/landing/landing-brand-button";
import {
  LANDING_GITHUB_URL,
  LANDING_NAV,
} from "@/components/landing/landing-constants";
import { LandingSectionLink } from "@/components/landing/landing-section-link";
import { landingNavLink } from "@/components/landing/landing-styles";
import { useLandingAuth } from "@/components/landing/use-landing-auth";
import { useLandingHeaderScroll } from "@/components/landing/use-landing-header-scroll";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <span
        className="inline-block size-9 shrink-0 rounded-md bg-neutral-100 dark:bg-neutral-800"
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <HiSun className="size-5" aria-hidden />
      ) : (
        <HiMoon className="size-5" aria-hidden />
      )}
    </button>
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
    <div className={cn("flex items-center gap-3", className)}>
      <ThemeToggle />
      <a
        href={LANDING_GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className="inline-flex size-9 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-white"
        aria-label="View on GitHub"
      >
        <SiGithub className="size-5" aria-hidden />
      </a>
      {authed ? (
        <LandingBrandButton
          size="default"
          className="h-9 px-4 text-sm"
          render={<Link to="/app/dashboard" onClick={onNavigate} />}
        >
          Dashboard
        </LandingBrandButton>
      ) : (
        <>
          <Link
            to="/login"
            onClick={onNavigate}
            className={cn(landingNavLink, "hidden sm:inline-flex")}
          >
            Log in
          </Link>
          <LandingBrandButton
            size="default"
            className="h-9 px-4 text-sm"
            render={<Link to="/signup" onClick={onNavigate} />}
          >
            Get started
          </LandingBrandButton>
        </>
      )}
    </div>
  );
}

function Logo({ className }: { className?: string }) {
  return (
    <Link
      to="/"
      className={cn(
        "flex items-center gap-2 rounded-md outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      <AppLogo />
    </Link>
  );
}

export function LandingHeader() {
  const authed = useLandingAuth();
  const [open, setOpen] = useState(false);
  const mode = useLandingHeaderScroll();
  const isTop = mode === "top";
  const isFloating = mode === "floating";

  const closeSheet = () => setOpen(false);

  return (
    <motion.header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[padding] duration-300",
        isFloating && "pt-3",
      )}
      initial={false}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>
      <div className="mx-auto w-full max-w-7xl transition-all duration-300">
        <div
          className={cn(
            "flex h-14 items-center justify-between px-4 transition-all duration-300 sm:h-16 md:px-8",
            isFloating
              ? "rounded-full border border-neutral-200/80 bg-white/80 shadow-lg backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/85"
              : "border-transparent border-b bg-transparent shadow-none",
          )}
          data-scrolled={!isTop}
        >
          <Logo />

          <nav
            className="hidden items-center gap-6 lg:flex lg:gap-8"
            aria-label="Primary"
          >
            {LANDING_NAV.map((item) => (
              <LandingSectionLink key={item.href} href={item.href}>
                {item.label}
              </LandingSectionLink>
            ))}
          </nav>

          <HeaderActions authed={authed} className="hidden lg:flex" />

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-10 rounded-md lg:hidden"
                  aria-label="Open menu"
                />
              }
            >
              <HiBars3 className="size-5 text-neutral-900 dark:text-white" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-full max-w-xs bg-white dark:bg-neutral-900"
            >
              <SheetHeader>
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <Logo />
              </SheetHeader>
              <nav
                className="flex flex-col gap-1 px-4"
                aria-label="Mobile primary"
              >
                {LANDING_NAV.map((item) => (
                  <SheetClose
                    key={item.href}
                    render={
                      <LandingSectionLink
                        href={item.href}
                        onClick={closeSheet}
                        className="rounded-xl px-4 py-3.5 text-base"
                      >
                        {item.label}
                      </LandingSectionLink>
                    }
                  />
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2 px-4 pb-4">
                <HeaderActions authed={authed} onNavigate={closeSheet} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  );
}
