import type {
  LoadTestResponse,
  LoadTestResultStatusEnum,
} from "@/api/generated/types.gen";

/** Run still in progress or dashboard metrics not built yet. */
const ACTIVE_RESULT_STATUSES = new Set<LoadTestResultStatusEnum>([
  "not_ready",
  "running",
]);

const RESULT_VIEW_BLOCKED_STATUSES = ACTIVE_RESULT_STATUSES;

const TERMINAL_RESULT_STATUSES = new Set<LoadTestResultStatusEnum>([
  "ready",
  "failed",
  "cancelled",
]);

type LoadTestRunState = Pick<LoadTestResponse, "status" | "latest_result">;

/** True while a run is active; uses latest_result when test.status lags behind. */
export function isLoadTestRunInProgress(test: LoadTestRunState): boolean {
  const latest = test.latest_result;
  if (latest && TERMINAL_RESULT_STATUSES.has(latest.status)) {
    return false;
  }
  return test.status === "pending" || test.status === "running";
}

export function canRunLoadTest(test: LoadTestRunState): boolean {
  if (isLoadTestRunInProgress(test)) return false;
  return test.status === "draft" || test.status === "complete";
}

export function canStopLoadTest(test: LoadTestRunState): boolean {
  return isLoadTestRunInProgress(test);
}

export function canDeleteLoadTest(test: LoadTestRunState): boolean {
  return !isLoadTestRunInProgress(test);
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

/** Show Stop on the run result page only while this run is still active. */
export function canAbortResultRun(
  status: LoadTestResultStatusEnum,
  canAbort?: boolean,
) {
  if (canAbort === false) return false;
  return ACTIVE_RESULT_STATUSES.has(status);
}

export function formatLoadTestDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export { TERMINAL_RESULT_STATUSES };
