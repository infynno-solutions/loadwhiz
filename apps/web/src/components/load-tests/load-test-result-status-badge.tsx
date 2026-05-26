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
  "neutral" | "info" | "destructive"
> = {
  not_ready: "neutral",
  ready: "info",
  running: "info",
  failed: "destructive",
  cancelled: "neutral",
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
