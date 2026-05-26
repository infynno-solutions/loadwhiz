import type { QueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

import {
  hostsListOptions,
  hostsListQueryKey,
  loadTestsGetOptions,
  loadTestsGetQueryKey,
  loadTestsListOptions,
  loadTestsListQueryKey,
  loadTestsResultsDashboardOptions,
  loadTestsResultsDashboardQueryKey,
  loadTestsResultsListOptions,
  loadTestsResultsListQueryKey,
} from "@/api/generated/@tanstack/react-query.gen";
import type {
  HostResponse,
  LoadTestResponse,
  LoadTestResultSummary,
  LoadTestStatusEnum,
  RunLoadTestResponse,
} from "@/api/generated/types.gen";
import {
  isLoadTestRunInProgress,
  TERMINAL_RESULT_STATUSES,
} from "@/lib/load-test-actions";

export function loadTestsListQueryKeyForOrg(
  orgId: string,
  hostId?: string | null,
) {
  return loadTestsListQueryKey({
    path: { org_id: orgId },
    query: hostId ? { host_id: hostId } : undefined,
  });
}

export function loadTestsGetQueryKeyFor(orgId: string, testId: string) {
  return loadTestsGetQueryKey({
    path: { org_id: orgId, test_id: testId },
  });
}

export function loadTestsResultsListQueryKeyFor(orgId: string, testId: string) {
  return loadTestsResultsListQueryKey({
    path: { org_id: orgId, test_id: testId },
  });
}

export function loadTestsResultsDashboardQueryKeyFor(
  orgId: string,
  testId: string,
  resultId: string,
) {
  return loadTestsResultsDashboardQueryKey({
    path: { org_id: orgId, test_id: testId, result_id: resultId },
  });
}

function listRefetchInterval(tests: LoadTestResponse[] | undefined) {
  if (!tests?.some((t) => isLoadTestRunInProgress(t))) {
    return false;
  }
  return 5_000;
}

export function useVerifiedHosts(orgId: string | undefined) {
  return useQuery({
    ...hostsListOptions({ path: { org_id: orgId ?? "" } }),
    enabled: Boolean(orgId),
    select: (hosts) => hosts.filter((h) => h.status === "verified"),
  });
}

export function useLoadTestsList(
  orgId: string | undefined,
  hostId?: string | null,
) {
  return useQuery({
    ...loadTestsListOptions({
      path: { org_id: orgId ?? "" },
      query: hostId ? { host_id: hostId } : undefined,
    }),
    enabled: Boolean(orgId),
    refetchInterval: (query) => listRefetchInterval(query.state.data),
  });
}

export function useLoadTest(orgId: string | undefined, testId: string) {
  return useQuery({
    ...loadTestsGetOptions({
      path: { org_id: orgId ?? "", test_id: testId },
    }),
    enabled: Boolean(orgId && testId),
    refetchInterval: (query) => {
      const test = query.state.data;
      if (!test || !isLoadTestRunInProgress(test)) return false;
      return 5_000;
    },
  });
}

export function useLoadTestResults(
  orgId: string | undefined,
  testId: string,
  testStatus?: LoadTestStatusEnum,
  enabled = true,
) {
  return useQuery({
    ...loadTestsResultsListOptions({
      path: { org_id: orgId ?? "", test_id: testId },
    }),
    enabled: Boolean(orgId && testId && enabled),
    refetchInterval: (query) => {
      const results = query.state.data;
      if (
        results?.some((r) => r.status === "running" || r.status === "not_ready")
      ) {
        return 5_000;
      }
      if (testStatus === "pending" || testStatus === "running") {
        return 5_000;
      }
      return false;
    },
  });
}

function runResponseToResultSummary(
  run: RunLoadTestResponse,
): LoadTestResultSummary {
  return {
    result_id: run.result_id,
    test_id: run.test_id,
    status: run.status,
    started_at: run.started_at,
    finished_at: run.finished_at,
    passed: run.passed,
    metrics: run.metrics,
    exit_code: run.exit_code,
    error_message: run.error_message,
    created_at: run.started_at ?? new Date().toISOString(),
  };
}

function testStatusFromRun(run: RunLoadTestResponse): LoadTestStatusEnum {
  return run.status === "running" ? "running" : "pending";
}

export function applyRunStartedOptimisticUpdates(
  queryClient: QueryClient,
  orgId: string,
  testId: string,
  run: RunLoadTestResponse,
) {
  const result = runResponseToResultSummary(run);
  const testStatus = testStatusFromRun(run);

  queryClient.setQueryData(
    loadTestsGetQueryKeyFor(orgId, testId),
    (old: LoadTestResponse | undefined) => {
      if (!old) return old;
      return {
        ...old,
        status: testStatus,
        latest_result: result,
      };
    },
  );

  queryClient.setQueryData(
    loadTestsResultsListQueryKeyFor(orgId, testId),
    (old: LoadTestResultSummary[] | undefined) => {
      if (!old?.length) return [result];
      const index = old.findIndex((r) => r.result_id === result.result_id);
      if (index === -1) return [result, ...old];
      const next = [...old];
      next[index] = { ...next[index], ...result };
      return next;
    },
  );
}

export function mergeResultsWithLatest(
  results: LoadTestResultSummary[],
  latest?: LoadTestResultSummary | null,
) {
  if (!latest) return results;
  if (results.some((r) => r.result_id === latest.result_id)) return results;
  return [latest, ...results];
}

/** Sync test.status to complete when the latest run has finished. */
export function reconcileLoadTestStatusFromResults(
  queryClient: QueryClient,
  orgId: string,
  testId: string,
  test: LoadTestResponse,
  results: LoadTestResultSummary[],
) {
  if (test.status !== "pending" && test.status !== "running") return;

  const latest =
    results.find((r) => r.result_id === test.latest_result?.result_id) ??
    results[0] ??
    test.latest_result;
  if (!latest || !TERMINAL_RESULT_STATUSES.has(latest.status)) return;

  const patch = (old: LoadTestResponse): LoadTestResponse => ({
    ...old,
    status: "complete",
    latest_result: latest,
  });

  queryClient.setQueryData(
    loadTestsGetQueryKeyFor(orgId, testId),
    (old: LoadTestResponse | undefined) => (old ? patch(old) : old),
  );

  queryClient.setQueriesData(
    { queryKey: loadTestsListQueryKeyForOrg(orgId) },
    (old: LoadTestResponse[] | undefined) =>
      old?.map((t) => (t.test_id === testId ? patch(t) : t)),
  );
}

export async function invalidateLoadTestQueries(
  queryClient: QueryClient,
  orgId: string,
  testId: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: loadTestsListQueryKeyForOrg(orgId),
    }),
    queryClient.invalidateQueries({
      queryKey: loadTestsGetQueryKeyFor(orgId, testId),
    }),
    queryClient.invalidateQueries({
      queryKey: loadTestsResultsListQueryKeyFor(orgId, testId),
    }),
  ]);
}

export function useResultDashboard(
  orgId: string | undefined,
  testId: string,
  resultId: string,
) {
  return useQuery({
    ...loadTestsResultsDashboardOptions({
      path: {
        org_id: orgId ?? "",
        test_id: testId,
        result_id: resultId,
      },
    }),
    enabled: Boolean(orgId && testId && resultId),
    refetchInterval: (query) => {
      const status = query.state.data?.meta.status;
      if (status !== "running" && status !== "not_ready") return false;
      return 5_000;
    },
  });
}

export function buildHostNameMap(hosts: HostResponse[] | undefined) {
  const map = new Map<string, string>();
  for (const host of hosts ?? []) {
    map.set(host.id, host.hostname);
  }
  return map;
}

export function getLoadTestDisplayName(test: LoadTestResponse) {
  return test.name?.trim() || `Test ${test.test_id.slice(0, 8)}`;
}

export { hostsListQueryKey };
