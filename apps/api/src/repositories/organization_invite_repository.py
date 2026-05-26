import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.organization_invite import InviteStatus, OrganizationInvite


class OrganizationInviteRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, invite_id: uuid.UUID) -> OrganizationInvite | None:
        result = await self.db.execute(
            select(OrganizationInvite).where(OrganizationInvite.id == invite_id)
        )
        return result.scalar_one_or_none()

    async def get_by_token(self, token: str) -> OrganizationInvite | None:
        result = await self.db.execute(
            select(OrganizationInvite).where(OrganizationInvite.token == token)
        )
        return result.scalar_one_or_none()

    async def get_pending_by_email(
        self,
        organization_id: uuid.UUID,
        email: str,
    ) -> OrganizationInvite | None:
        result = await self.db.execute(
            select(OrganizationInvite).where(
                OrganizationInvite.organization_id == organization_id,
                OrganizationInvite.email == email,
                OrganizationInvite.status == InviteStatus.pending,
            )
        )
        return result.scalar_one_or_none()

    async def list_pending_by_organization(
        self,
        organization_id: uuid.UUID,
    ) -> list[OrganizationInvite]:
        result = await self.db.execute(
            select(OrganizationInvite).where(
                OrganizationInvite.organization_id == organization_id,
                OrganizationInvite.status == InviteStatus.pending,
            )
        )
        return list(result.scalars().all())

    async def create(self, invite: OrganizationInvite) -> OrganizationInvite:
        self.db.add(invite)
        await self.db.commit()
        await self.db.refresh(invite)
        return invite

    async def update(self, invite: OrganizationInvite) -> OrganizationInvite:
        await self.db.commit()
        await self.db.refresh(invite)
        return invite
