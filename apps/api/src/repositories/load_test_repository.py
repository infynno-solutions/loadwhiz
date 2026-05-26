import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.load_test import LoadTest


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
