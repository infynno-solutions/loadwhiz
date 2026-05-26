from __future__ import annotations

import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status

from src.core.config import settings
from src.core.load_test_run_validation import validate_runnable_urls
from src.core.load_test_validation import validate_host_verified
from src.models.host import HostStatus
from src.models.load_test import (
    LoadTest,
    LoadTestResult,
    LoadTestResultStatus,
    LoadTestStatus,
)
from src.repositories.host_repository import HostRepository
from src.repositories.load_test_repository import LoadTestRepository
from src.repositories.load_test_result_repository import LoadTestResultRepository
from src.workers.tasks.load_test_run import run_load_test, stop_load_test


class LoadTestRunService:
    def __init__(
        self,
        load_test_repository: LoadTestRepository,
        result_repository: LoadTestResultRepository,
        host_repository: HostRepository,
    ):
        self.load_test_repository = load_test_repository
        self.result_repository = result_repository
        self.host_repository = host_repository

    async def run_test(
        self,
        organization_id: uuid.UUID,
        test_id: uuid.UUID,
    ) -> dict:
        load_test = await self._get_runnable_test(organization_id, test_id)

        active_count = await self.result_repository.count_active_runs_for_org(
            organization_id
        )
        if active_count >= settings.load_test_max_concurrent_runs:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Organization concurrent run limit reached",
            )

        now = datetime.now(UTC)
        result = LoadTestResult(
            load_test_id=load_test.id,
            status=LoadTestResultStatus.running,
            started_at=now,
        )
        result = await self.result_repository.create(result)

        load_test.status = LoadTestStatus.pending
        load_test.active_result_id = result.id
        load_test.updated_at = now
        await self.load_test_repository.update(load_test)

        scheduled_at = load_test.scheduled_at
        if scheduled_at and scheduled_at.tzinfo is None:
            scheduled_at = scheduled_at.replace(tzinfo=UTC)

        if scheduled_at and scheduled_at > now:
            run_load_test.apply_async(
                args=[str(load_test.id), str(result.id)],
                eta=scheduled_at,
            )
        else:
            run_load_test.delay(str(load_test.id), str(result.id))

        return self._result_to_dict(result, load_test)

    async def stop_test(
        self,
        organization_id: uuid.UUID,
        test_id: uuid.UUID,
    ) -> dict:
        load_test = await self._get_or_404(organization_id, test_id)

        if load_test.status not in (LoadTestStatus.pending, LoadTestStatus.running):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Test is not pending or running",
            )

        if not load_test.active_result_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="No active run to stop",
            )

        stop_load_test.delay(str(load_test.id), str(load_test.active_result_id))

        return {
            "message": "Stop requested",
            "test_id": load_test.id,
            "result_id": load_test.active_result_id,
        }

    async def list_results(
        self,
        organization_id: uuid.UUID,
        test_id: uuid.UUID,
    ) -> list[dict]:
        load_test = await self._get_or_404(organization_id, test_id)
        results = await self.result_repository.list_by_load_test(load_test.id)
        return [self._result_to_dict(r, load_test) for r in results]

    async def get_result(
        self,
        organization_id: uuid.UUID,
        test_id: uuid.UUID,
        result_id: uuid.UUID,
    ) -> dict:
        load_test = await self._get_or_404(organization_id, test_id)
        result = await self.result_repository.get_by_test_and_id(
            load_test.id, result_id
        )
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Result not found",
            )
        return self._result_to_dict(result, load_test)

    async def get_result_dashboard(
        self,
        organization_id: uuid.UUID,
        test_id: uuid.UUID,
        result_id: uuid.UUID,
    ) -> dict:
        load_test = await self._get_or_404(organization_id, test_id)
        result = await self.result_repository.get_by_test_and_id(
            load_test.id, result_id
        )
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Result not found",
            )
        if not result.dashboard:
            if result.status == LoadTestResultStatus.running:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Dashboard is not available while the run is in progress",
                )
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Dashboard data is not available for this result",
            )
        return result.dashboard

    async def _get_runnable_test(
        self,
        organization_id: uuid.UUID,
        test_id: uuid.UUID,
    ) -> LoadTest:
        load_test = await self._get_or_404(organization_id, test_id)

        if load_test.status not in (LoadTestStatus.draft, LoadTestStatus.complete):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Test must be in draft or complete status to run",
            )

        host = await self.host_repository.get_by_id(load_test.host_id)
        if not host or host.organization_id != organization_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Host not found",
            )
        try:
            validate_host_verified(host)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(exc),
            ) from exc

        try:
            validate_runnable_urls(load_test.urls)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(exc),
            ) from exc

        if host.status != HostStatus.verified:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Target host must be verified",
            )

        return load_test

    async def _get_or_404(
        self,
        organization_id: uuid.UUID,
        test_id: uuid.UUID,
    ) -> LoadTest:
        load_test = await self.load_test_repository.get_by_org_and_id(
            organization_id, test_id
        )
        if not load_test:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test not found",
            )
        return load_test

    def _result_to_dict(self, result: LoadTestResult, load_test: LoadTest) -> dict:
        return {
            "result_id": result.id,
            "test_id": load_test.id,
            "status": result.status.value,
            "started_at": result.started_at,
            "finished_at": result.finished_at,
            "passed": result.passed,
            "metrics": result.metrics,
            "exit_code": result.exit_code,
            "error_message": result.error_message,
            "created_at": result.created_at,
        }
