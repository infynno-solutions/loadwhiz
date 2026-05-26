import { Badge } from "@loadwhiz/ui/components/badge";
import { cn } from "@loadwhiz/ui/lib/utils";

import type { OrganizationRole } from "@/lib/user-queries";

type RoleBadgeProps = {
  role: string;
  className?: string;
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const normalized = role.toLowerCase() as OrganizationRole;

  return (
    <Badge
      variant={normalized === "owner" ? "default" : "neutral"}
      className={cn("capitalize", className)}
    >
      {normalized}
    </Badge>
  );
}
