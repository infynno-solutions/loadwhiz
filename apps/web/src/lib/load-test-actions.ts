import type {
  LoadTestResponse,
  LoadTestResultStatusEnum,
  LoadTestStatusEnum,
} from "@/api/generated/types.gen";

const RESULT_VIEW_BLOCKED_STATUSES = new Set<LoadTestResultStatusEnum>([
  "not_ready",
  "ready",
  "running",
]);

export function canRunLoadTest(status: LoadTestStatusEnum) {
  return status === "draft" || status === "complete";
}

export function canStopLoadTest(status: LoadTestStatusEnum) {
  return status === "pending" || status === "running";
}

export function canDeleteLoadTest(status: LoadTestStatusEnum) {
  return !canStopLoadTest(status);
}

export function canEditLoadTest(test: LoadTestResponse) {
  return test.status === "draft" && test.url_source === "manual";
}

export function canViewResultDashboard(
  status: LoadTestResultStatusEnum,
  passed?: boolean | null,
) {
  if (RESULT_VIEW_BLOCKED_STATUSES.has(status)) return false;
  return passed === true;
}

export function formatLoadTestDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}
