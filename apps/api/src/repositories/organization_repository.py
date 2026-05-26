import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.organization import Organization


class OrganizationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, organization_id: uuid.UUID) -> Organization | None:
        result = await self.db.execute(
            select(Organization).where(Organization.id == organization_id)
        )
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Organization | None:
        result = await self.db.execute(
            select(Organization).where(Organization.slug == slug)
        )
        return result.scalar_one_or_none()

    async def slug_exists(self, slug: str, exclude_id: uuid.UUID | None = None) -> bool:
        query = select(Organization.id).where(Organization.slug == slug)
        if exclude_id:
            query = query.where(Organization.id != exclude_id)
        result = await self.db.execute(query)
        return result.scalar_one_or_none() is not None

    async def create(self, organization: Organization) -> Organization:
        self.db.add(organization)
        await self.db.commit()
        await self.db.refresh(organization)
        return organization

    async def update(self, organization: Organization) -> Organization:
        await self.db.commit()
        await self.db.refresh(organization)
        return organization

    async def delete(self, organization: Organization) -> None:
        await self.db.delete(organization)
        await self.db.commit()
