import { Link } from "@tanstack/react-router";

import { AppLogo } from "@/components/app-logo";

export function AuthPageBrand() {
  return (
    <div className="mb-8 flex justify-center">
      <Link
        to="/"
        className="rounded-lg outline-none transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <AppLogo size="lg" />
      </Link>
    </div>
  );
}
