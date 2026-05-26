import datetime
import uuid

from src.api.v1.organizations.schemas import (
    OrgDashboardHighlight,
    OrgDashboardRecentRun,
    OrgDashboardResponse,
    OrgDashboardResultMetrics,
    OrgDashboardStats,
)
from src.core.k6_metrics import extract_metrics
from src.models.host import Host, HostStatus
from src.models.load_test import LoadTest, LoadTestResult, LoadTestStatus
from src.repositories.host_repository import HostRepository
from src.repositories.load_test_repository import LoadTestRepository
from src.repositories.load_test_result_repository import LoadTestResultRepository


def _metrics_from_result(result: LoadTestResult) -> OrgDashboardResultMetrics | None:
    m = result.metrics
    if isinstance(result.summary, dict):
        m = extract_metrics(result.summary)
    elif not m:
        return None
    return OrgDashboardResultMetrics(
        total_requests=m.get("total_requests", 0),
        error_rate_percent=m.get("error_rate_percent", 0.0),
        rps=m.get("rps", 0.0),
        avg_ms=m.get("avg_ms"),
        p95_ms=m.get("p95_ms"),
    )


def _test_display_name(test: LoadTest) -> str:
    return test.name or f"Test {str(test.id)[:8]}"


def _recent_run_from_row(
    result: LoadTestResult, test: LoadTest, host: Host
) -> OrgDashboardRecentRun:
    return OrgDashboardRecentRun(
        result_id=result.id,
        test_id=test.id,
        test_name=_test_display_name(test),
        host_hostname=host.hostname,
        status=result.status.value,
        passed=result.passed,
        started_at=result.started_at,
        finished_at=result.finished_at,
        metrics=_metrics_from_result(result),
    )


class DashboardService:
    def __init__(
        self,
        test_repository: LoadTestRepository,
        result_repository: LoadTestResultRepository,
        host_repository: HostRepository,
    ) -> None:
        self._tests = test_repository
        self._results = result_repository
        self._hosts = host_repository

    async def get_org_dashboard(self, org_id: uuid.UUID) -> OrgDashboardResponse:
        seven_days_ago = datetime.datetime.now(tz=datetime.timezone.utc) - datetime.timedelta(
            days=7
        )

        (
            total_tests,
            active_runs,
            draft_tests,
            failed_last_run,
            runs_7d,
            hosts_total,
            hosts_verified,
            hosts_pending,
            hosts_failed,
        ) = await _gather(
            self._tests.count_by_organization(org_id),
            self._results.count_active_runs_for_org(org_id),
            self._tests.count_by_status(org_id, LoadTestStatus.draft),
            self._tests.count_with_failed_latest(org_id),
            self._results.count_runs_since(org_id, seven_days_ago),
            self._hosts.count_by_organization(org_id),
            self._hosts.count_by_status(org_id, HostStatus.verified),
            self._hosts.count_by_status(org_id, HostStatus.pending),
            self._hosts.count_by_status(org_id, HostStatus.failed),
        )

        stats = OrgDashboardStats(
            total_tests=total_tests,
            active_runs=active_runs,
            draft_tests=draft_tests,
            failed_last_run=failed_last_run,
            runs_last_7_days=runs_7d,
            hosts_total=hosts_total,
            hosts_verified=hosts_verified,
            hosts_pending=hosts_pending,
            hosts_failed=hosts_failed,
        )

        # Performance highlight: prefer active run, fall back to latest completed.
        highlight: OrgDashboardHighlight | None = None
        if active_runs > 0:
            row = await self._results.get_latest_active_for_org(org_id)
            if row:
                result, test, host = row
                highlight = OrgDashboardHighlight(
                    kind="active",
                    test_id=test.id,
                    test_name=_test_display_name(test),
                    host_hostname=host.hostname,
                    result_id=result.id,
                    status=result.status.value,
                    passed=result.passed,
                    started_at=result.started_at,
                    finished_at=result.finished_at,
                    metrics=_metrics_from_result(result),
                )
        else:
            row = await self._results.get_latest_completed_for_org(org_id)
            if row:
                result, test, host = row
                highlight = OrgDashboardHighlight(
                    kind="latest_completed",
                    test_id=test.id,
                    test_name=_test_display_name(test),
                    host_hostname=host.hostname,
                    result_id=result.id,
                    status=result.status.value,
                    passed=result.passed,
                    started_at=result.started_at,
                    finished_at=result.finished_at,
                    metrics=_metrics_from_result(result),
                )

        recent_rows = await self._results.list_recent_for_org(org_id, limit=10)
        recent_runs = [_recent_run_from_row(r, t, h) for r, t, h in recent_rows]

        return OrgDashboardResponse(
            stats=stats,
            performance_highlight=highlight,
            recent_runs=recent_runs,
        )


async def _gather(*coros):  # type: ignore[no-untyped-def]
    """Await all coroutines concurrently and return their results in order."""
    import asyncio

    return await asyncio.gather(*coros)
