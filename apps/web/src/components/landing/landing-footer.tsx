import { Link } from "@tanstack/react-router";

import { AppLogo } from "@/components/app-logo";
import {
  LANDING_GITHUB_URL,
  LANDING_NAV,
} from "@/components/landing/landing-constants";

export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-8">
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-16">
          <div className="flex flex-col gap-4">
            <a
              href="#top"
              className="w-fit rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <AppLogo size="sm" />
            </a>
            <p className="max-w-sm text-muted-foreground text-sm leading-relaxed">
              Performance testing for engineering teams who ship often and can't
              afford surprises.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <p className="font-semibold text-foreground text-xs uppercase tracking-wider">
              Product
            </p>
            <ul className="flex flex-col gap-3">
              {LANDING_NAV.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-4">
            <p className="font-semibold text-foreground text-xs uppercase tracking-wider">
              Legal & source
            </p>
            <ul className="flex flex-col gap-3">
              <li>
                <Link
                  to="/privacy"
                  className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                >
                  Terms
                </Link>
              </li>
              <li>
                <a
                  href={LANDING_GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 pt-4 sm:flex-row">
          <p className="text-center text-muted-foreground text-sm sm:text-left">
            © {year} LoadWhiz
          </p>
          <p className="text-center text-muted-foreground text-sm sm:text-right">
            Built by{" "}
            <a
              href="https://infynno.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              Infynno Solutions
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
