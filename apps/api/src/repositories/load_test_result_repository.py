import datetime
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.load_test import LoadTest, LoadTestResult, LoadTestResultStatus, LoadTestStatus
from src.models.host import Host


class LoadTestResultRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, result_id: uuid.UUID) -> LoadTestResult | None:
        result = await self.db.execute(
            select(LoadTestResult).where(LoadTestResult.id == result_id)
        )
        return result.scalar_one_or_none()

    async def get_by_test_and_id(
        self,
        load_test_id: uuid.UUID,
        result_id: uuid.UUID,
    ) -> LoadTestResult | None:
        result = await self.db.execute(
            select(LoadTestResult).where(
                LoadTestResult.id == result_id,
                LoadTestResult.load_test_id == load_test_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_by_load_test(self, load_test_id: uuid.UUID) -> list[LoadTestResult]:
        result = await self.db.execute(
            select(LoadTestResult)
            .where(LoadTestResult.load_test_id == load_test_id)
            .order_by(LoadTestResult.created_at.desc())
        )
        return list(result.scalars().all())

    async def count_active_runs_for_org(self, organization_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.count())
            .select_from(LoadTestResult)
            .join(LoadTest, LoadTestResult.load_test_id == LoadTest.id)
            .where(
                LoadTest.organization_id == organization_id,
                LoadTest.status.in_(
                    (LoadTestStatus.pending, LoadTestStatus.running)
                ),
                LoadTestResult.status.in_(
                    (
                        LoadTestResultStatus.running,
                        LoadTestResultStatus.not_ready,
                    )
                ),
            )
        )
        return int(result.scalar_one())

    async def count_runs_since(
        self, organization_id: uuid.UUID, since: datetime.datetime
    ) -> int:
        result = await self.db.execute(
            select(func.count())
            .select_from(LoadTestResult)
            .join(LoadTest, LoadTestResult.load_test_id == LoadTest.id)
            .where(
                LoadTest.organization_id == organization_id,
                LoadTestResult.started_at >= since,
            )
        )
        return int(result.scalar_one())

    async def list_recent_for_org(
        self, organization_id: uuid.UUID, limit: int = 10
    ) -> list[tuple[LoadTestResult, LoadTest, Host]]:
        """Return the most recent results across all tests for an org, with test and host."""
        rows = await self.db.execute(
            select(LoadTestResult, LoadTest, Host)
            .join(LoadTest, LoadTestResult.load_test_id == LoadTest.id)
            .join(Host, LoadTest.host_id == Host.id)
            .where(LoadTest.organization_id == organization_id)
            .order_by(LoadTestResult.created_at.desc())
            .limit(limit)
        )
        return list(rows.all())

    async def get_latest_active_for_org(
        self, organization_id: uuid.UUID
    ) -> tuple[LoadTestResult, LoadTest, Host] | None:
        """Return the most recently started active run across the org, if any."""
        row = await self.db.execute(
            select(LoadTestResult, LoadTest, Host)
            .join(LoadTest, LoadTestResult.load_test_id == LoadTest.id)
            .join(Host, LoadTest.host_id == Host.id)
            .where(
                LoadTest.organization_id == organization_id,
                LoadTestResult.status.in_(
                    (LoadTestResultStatus.running, LoadTestResultStatus.not_ready)
                ),
            )
            .order_by(LoadTestResult.created_at.desc())
            .limit(1)
        )
        return row.first()

    async def get_latest_completed_for_org(
        self, organization_id: uuid.UUID
    ) -> tuple[LoadTestResult, LoadTest, Host] | None:
        """Return the most recently completed (ready) result across the org, if any."""
        row = await self.db.execute(
            select(LoadTestResult, LoadTest, Host)
            .join(LoadTest, LoadTestResult.load_test_id == LoadTest.id)
            .join(Host, LoadTest.host_id == Host.id)
            .where(
                LoadTest.organization_id == organization_id,
                LoadTestResult.status == LoadTestResultStatus.ready,
            )
            .order_by(LoadTestResult.created_at.desc())
            .limit(1)
        )
        return row.first()

    async def create(self, load_test_result: LoadTestResult) -> LoadTestResult:
        self.db.add(load_test_result)
        await self.db.commit()
        await self.db.refresh(load_test_result)
        return load_test_result

    async def update(self, load_test_result: LoadTestResult) -> LoadTestResult:
        await self.db.commit()
        await self.db.refresh(load_test_result)
        return load_test_result
