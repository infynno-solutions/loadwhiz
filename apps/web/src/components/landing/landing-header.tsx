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
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { HiBars3, HiMoon, HiOutlineBolt, HiSun } from "react-icons/hi2";
import { SiGithub } from "react-icons/si";

import {
  LANDING_GITHUB_URL,
  LANDING_NAV,
} from "@/components/landing/landing-constants";
import { useLandingAuth } from "@/components/landing/use-landing-auth";

const SCROLL_THRESHOLD = 72;

function NavLink({
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
    <a
      href={href}
      onClick={onClick}
      className={cn(
        "rounded-lg px-3.5 py-2 text-muted-foreground text-sm transition-colors hover:bg-muted/60 hover:text-foreground",
        className,
      )}
    >
      {children}
    </a>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <span
        className="inline-block size-11 shrink-0 rounded-lg bg-muted/50"
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
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
    <div
      className={cn(
        "flex flex-col gap-2 sm:flex-row sm:items-center",
        className,
      )}
    >
      <ThemeToggle />
      <a
        href={LANDING_GITHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className="inline-flex size-11 cursor-pointer items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        aria-label="View on GitHub"
      >
        <SiGithub className="size-5" aria-hidden />
      </a>
      {authed ? (
        <Button
          size="default"
          className="h-11 rounded-lg px-5 shadow-sm"
          render={<Link to="/app/dashboard" onClick={onNavigate} />}
        >
          Dashboard
        </Button>
      ) : (
        <>
          <Link
            to="/login"
            onClick={onNavigate}
            className="inline-flex h-11 items-center justify-center rounded-lg px-4 text-muted-foreground text-sm transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            Log in
          </Link>
          <Button
            size="default"
            className="h-11 rounded-lg px-5 shadow-sm"
            render={<Link to="/signup" onClick={onNavigate} />}
          >
            Get started
          </Button>
        </>
      )}
    </div>
  );
}

function Logo({ className }: { className?: string }) {
  return (
    <a
      href="#top"
      className={cn(
        "group flex items-center gap-3 rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className,
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-xl bg-linear-to-br from-violet-600 to-primary shadow-primary/25 shadow-sm">
        <HiOutlineBolt className="size-5 text-primary-foreground" aria-hidden />
      </span>
      <span className="font-bold text-lg tracking-tight">
        Load<span className="text-primary">Whiz</span>
      </span>
    </a>
  );
}

export function LandingHeader() {
  const authed = useLandingAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeSheet = () => setOpen(false);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 motion-safe:transition-[padding] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]",
        scrolled ? "px-0 pt-0" : "px-4 pt-4 sm:px-6",
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>
      <div
        className={cn(
          "mx-auto flex h-16 w-full items-center justify-between gap-4 px-5 backdrop-blur-xl supports-backdrop-filter:bg-background/60 motion-safe:transition-[border-radius,box-shadow,max-width,background-color] motion-safe:duration-200 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]",
          scrolled
            ? "max-w-none rounded-none bg-background/90 shadow-sm supports-backdrop-filter:bg-background/75"
            : "max-w-6xl rounded-2xl border border-border/50 bg-background/70 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.2)] supports-backdrop-filter:bg-background/50 dark:border-white/10 dark:shadow-[0_8px_32px_-8px_rgba(0,0,0,0.45)]",
        )}
      >
        <Logo />

        <nav
          className="hidden items-center gap-0.5 md:flex"
          aria-label="Primary"
        >
          {LANDING_NAV.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <HeaderActions authed={authed} className="hidden md:flex" />

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="size-11 rounded-lg md:hidden"
                aria-label="Open menu"
              />
            }
          >
            <HiBars3 className="size-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-xs">
            <SheetHeader>
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <Logo />
            </SheetHeader>
            <nav
              className="flex flex-col gap-0.5 px-4"
              aria-label="Mobile primary"
            >
              {LANDING_NAV.map((item) => (
                <SheetClose
                  key={item.href}
                  render={
                    <NavLink
                      href={item.href}
                      onClick={closeSheet}
                      className="w-full"
                    >
                      {item.label}
                    </NavLink>
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
