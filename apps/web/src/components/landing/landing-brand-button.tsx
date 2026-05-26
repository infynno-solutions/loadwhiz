import { Button } from "@loadwhiz/ui/components/button";
import { cn } from "@loadwhiz/ui/lib/utils";
import type { ComponentProps } from "react";

import { landingBrandButtonClass } from "@/components/landing/landing-styles";

type LandingBrandButtonProps = ComponentProps<typeof Button>;

export function LandingBrandButton({
  className,
  variant,
  ...props
}: LandingBrandButtonProps) {
  return (
    <Button
      variant={variant ?? "default"}
      className={cn(
        "border-0 text-white shadow-none",
        "!bg-linear-to-b !from-brand-secondary !to-brand-primary",
        "hover:!bg-linear-to-b hover:!from-brand-secondary hover:!to-brand-primary hover:text-white",
        landingBrandButtonClass,
        className,
      )}
      {...props}
    />
  );
}
