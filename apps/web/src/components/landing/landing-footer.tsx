"use client";

import { cn } from "@loadwhiz/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { HiMoon, HiSun } from "react-icons/hi2";
import { SiGithub } from "react-icons/si";

import { AppLogo } from "@/components/app-logo";
import {
  LANDING_FOOTER_COLUMNS,
  LANDING_GITHUB_URL,
} from "@/components/landing/landing-constants";

const footerLinkClass =
  "transition-colors hover:text-neutral-800 dark:hover:text-white";

const footerColumnTitleClass =
  "font-bold text-neutral-600 dark:text-neutral-300";

function FooterThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <span
        className="inline-block size-5 shrink-0 rounded-md bg-neutral-100 dark:bg-neutral-800"
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex cursor-pointer items-center justify-center text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
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

function FooterLink({
  label,
  href,
  external,
}: {
  label: string;
  href: string;
  external?: boolean;
}) {
  const className = cn(
    "text-neutral-600 dark:text-neutral-300",
    footerLinkClass,
  );

  if (external || href.startsWith("http")) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {label}
      </a>
    );
  }

  if (href.startsWith("#")) {
    return (
      <a href={href} className={className}>
        {label}
      </a>
    );
  }

  return (
    <Link to={href} className={className}>
      {label}
    </Link>
  );
}

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative w-full border-neutral-100 border-t bg-white px-8 pt-20 pb-16 dark:border-white/10 dark:bg-neutral-950 md:pb-20">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 text-neutral-500 text-sm lg:flex-row lg:items-start lg:justify-between lg:gap-16">
        <div className="max-w-md shrink-0 lg:max-w-lg lg:pr-8">
          <div className="mb-4">
            <a
              href="#top"
              className="relative z-20 inline-flex items-center space-x-2 rounded-md px-2 py-1 outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <AppLogo size="sm" wordmarkClassName="text-foreground" />
            </a>
          </div>

          <p className="mb-6 max-w-sm text-neutral-600 leading-relaxed dark:text-neutral-400">
            Performance testing for engineering teams who ship often and
            can&apos;t afford surprises.
          </p>

          <div className="flex items-center gap-4">
            <a
              href={LANDING_GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-neutral-500 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              aria-label="GitHub"
            >
              <SiGithub className="size-5" aria-hidden />
            </a>
            <FooterThemeToggle />
          </div>

          <p className="mt-6 text-neutral-500 dark:text-neutral-400">
            © {year} LoadWhiz. All rights reserved.
          </p>
        </div>

        <div className="grid shrink-0 grid-cols-2 items-start gap-x-10 gap-y-10 lg:ml-auto lg:grid-cols-4 lg:gap-x-12">
          {LANDING_FOOTER_COLUMNS.map((column) => (
            <div
              key={column.title}
              className="flex w-full flex-col justify-center gap-4"
            >
              <p className={footerColumnTitleClass}>{column.title}</p>
              <ul className="flex list-none flex-col gap-4">
                {column.links.map((link) => (
                  <li key={link.label} className="list-none">
                    <FooterLink
                      label={link.label}
                      href={link.href}
                      external={"external" in link ? link.external : false}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
