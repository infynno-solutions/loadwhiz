import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.load_test import LoadTest, LoadTestStatus


class LoadTestRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, test_id: uuid.UUID) -> LoadTest | None:
        result = await self.db.execute(select(LoadTest).where(LoadTest.id == test_id))
        return result.scalar_one_or_none()

    async def get_by_org_and_id(
        self,
        organization_id: uuid.UUID,
        test_id: uuid.UUID,
    ) -> LoadTest | None:
        result = await self.db.execute(
            select(LoadTest).where(
                LoadTest.id == test_id,
                LoadTest.organization_id == organization_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_by_organization(
        self,
        organization_id: uuid.UUID,
        host_id: uuid.UUID | None = None,
    ) -> list[LoadTest]:
        query = (
            select(LoadTest)
            .where(LoadTest.organization_id == organization_id)
            .order_by(LoadTest.created_at.desc())
        )
        if host_id is not None:
            query = query.where(LoadTest.host_id == host_id)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def count_by_organization(self, organization_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.count())
            .select_from(LoadTest)
            .where(LoadTest.organization_id == organization_id)
        )
        return int(result.scalar_one())

    async def count_by_status(
        self, organization_id: uuid.UUID, status: LoadTestStatus
    ) -> int:
        result = await self.db.execute(
            select(func.count())
            .select_from(LoadTest)
            .where(
                LoadTest.organization_id == organization_id,
                LoadTest.status == status,
            )
        )
        return int(result.scalar_one())

    async def count_with_failed_latest(self, organization_id: uuid.UUID) -> int:
        """Count tests whose most recent result has passed=False."""
        from src.models.load_test import LoadTestResult  # avoid circular import at module level

        # Subquery: latest result id per test
        latest_subq = (
            select(
                LoadTestResult.load_test_id,
                func.max(LoadTestResult.created_at).label("max_created"),
            )
            .group_by(LoadTestResult.load_test_id)
            .subquery()
        )

        result = await self.db.execute(
            select(func.count())
            .select_from(LoadTest)
            .join(
                latest_subq,
                LoadTest.id == latest_subq.c.load_test_id,
            )
            .join(
                LoadTestResult,
                (LoadTestResult.load_test_id == LoadTest.id)
                & (LoadTestResult.created_at == latest_subq.c.max_created),
            )
            .where(
                LoadTest.organization_id == organization_id,
                LoadTestResult.passed == False,  # noqa: E712
            )
        )
        return int(result.scalar_one())

    async def create(self, load_test: LoadTest) -> LoadTest:
        self.db.add(load_test)
        await self.db.commit()
        await self.db.refresh(load_test)
        return load_test

    async def update(self, load_test: LoadTest) -> LoadTest:
        await self.db.commit()
        await self.db.refresh(load_test)
        return load_test

    async def delete(self, load_test: LoadTest) -> None:
        await self.db.delete(load_test)
        await self.db.commit()
