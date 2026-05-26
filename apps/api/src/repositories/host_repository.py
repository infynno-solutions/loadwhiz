import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.host import Host, HostStatus


class HostRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, host_id: uuid.UUID) -> Host | None:
        result = await self.db.execute(select(Host).where(Host.id == host_id))
        return result.scalar_one_or_none()

    async def get_by_org_and_hostname(
        self,
        organization_id: uuid.UUID,
        hostname: str,
    ) -> Host | None:
        result = await self.db.execute(
            select(Host).where(
                Host.organization_id == organization_id,
                Host.hostname == hostname,
            )
        )
        return result.scalar_one_or_none()

    async def list_by_organization(self, organization_id: uuid.UUID) -> list[Host]:
        result = await self.db.execute(
            select(Host)
            .where(Host.organization_id == organization_id)
            .order_by(Host.created_at.desc())
        )
        return list(result.scalars().all())

    async def create(self, host: Host) -> Host:
        self.db.add(host)
        await self.db.commit()
        await self.db.refresh(host)
        return host

    async def update(self, host: Host) -> Host:
        await self.db.commit()
        await self.db.refresh(host)
        return host

    async def delete(self, host: Host) -> None:
        await self.db.delete(host)
        await self.db.commit()
