import { Badge } from "@loadwhiz/ui/components/badge";

const statusConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "outline" | "destructive";
  }
> = {
  pending: { label: "Pending", variant: "outline" },
  verified: { label: "Verified", variant: "default" },
  failed: { label: "Failed", variant: "destructive" },
};

export function HostStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] ?? {
    label: status,
    variant: "secondary" as const,
  };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
