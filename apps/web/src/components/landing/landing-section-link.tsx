"use client";

import { cn } from "@loadwhiz/ui/lib/utils";

import { landingNavLink } from "@/components/landing/landing-styles";

type LandingSectionLinkProps = {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
};

/** Cross-route section links (`/#features`) with smooth scroll when already on `/`. */
export function LandingSectionLink({
  href,
  children,
  onClick,
  className,
}: LandingSectionLinkProps) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.();

    if (window.location.pathname !== "/" || !href.startsWith("/#")) {
      return;
    }

    const id = decodeURIComponent(href.slice(2));
    const target = id === "top" ? null : document.getElementById(id);

    if (id !== "top" && !target) {
      return;
    }

    event.preventDefault();

    if (id === "top") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    window.history.pushState(null, "", href);
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      className={cn(landingNavLink, className)}
    >
      {children}
    </a>
  );
}
