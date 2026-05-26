import { Separator } from "@loadwhiz/ui/components/separator";
import { Link } from "@tanstack/react-router";

import {
  LANDING_GITHUB_URL,
  LANDING_NAV,
} from "@/components/landing/landing-constants";
export function LandingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30">
      <div
        className="mx-auto w-full max-w-6xl px-4 sm:px-6 flex flex-col gap-8 py-12"
      >
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
          <div className="flex flex-col gap-3">
            <p className="font-semibold">LoadWhiz</p>
            <p className="text-muted-foreground text-sm">
              Performance testing for engineering teams who ship often and
              can't afford surprises.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <p className="font-medium text-sm">Product</p>
            <ul className="flex flex-col gap-2 text-sm">
              {LANDING_NAV.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <p className="font-medium text-sm">Legal & source</p>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <Link
                  to="/privacy"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Privacy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  Terms
                </Link>
              </li>
              <li>
                <a
                  href={LANDING_GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </div>
        </div>
        <Separator />
        <p className="text-center text-muted-foreground text-sm">
          © {year} LoadWhiz · Built by{" "}
          <a
            href="https://infynno.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Infynno Solutions
          </a>
        </p>
      </div>
    </footer>
  );
}
