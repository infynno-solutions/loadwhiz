import { Badge } from "@loadwhiz/ui/components/badge";
import type { LoadTestResultStatusEnum } from "@/api/generated/types.gen";

const STATUS_LABELS: Record<LoadTestResultStatusEnum, string> = {
  not_ready: "Not ready",
  ready: "Ready",
  running: "Running",
  failed: "Failed",
  cancelled: "Cancelled",
};

const STATUS_VARIANTS: Record<
  LoadTestResultStatusEnum,
  "default" | "secondary" | "destructive" | "outline"
> = {
  not_ready: "secondary",
  ready: "outline",
  running: "default",
  failed: "destructive",
  cancelled: "secondary",
};

export function LoadTestResultStatusBadge({
  status,
}: {
  status: LoadTestResultStatusEnum;
}) {
  return (
    <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>
  );
}
