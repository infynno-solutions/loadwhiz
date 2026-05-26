import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.organization import Organization
from src.models.organization_member import MemberRole, OrganizationMember
from src.models.user import User


class OrganizationMemberRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_membership(
        self,
        organization_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> OrganizationMember | None:
        result = await self.db.execute(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == organization_id,
                OrganizationMember.user_id == user_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_by_organization(
        self,
        organization_id: uuid.UUID,
    ) -> list[OrganizationMember]:
        result = await self.db.execute(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == organization_id
            )
        )
        return list(result.scalars().all())

    async def list_organizations_for_user(
        self,
        user_id: uuid.UUID,
    ) -> list[tuple[Organization, OrganizationMember]]:
        result = await self.db.execute(
            select(Organization, OrganizationMember)
            .join(
                OrganizationMember,
                OrganizationMember.organization_id == Organization.id,
            )
            .where(OrganizationMember.user_id == user_id)
        )
        return list(result.all())

    async def count_owners(self, organization_id: uuid.UUID) -> int:
        result = await self.db.execute(
            select(func.count())
            .select_from(OrganizationMember)
            .where(
                OrganizationMember.organization_id == organization_id,
                OrganizationMember.role == MemberRole.owner,
            )
        )
        return result.scalar_one()

    async def create(self, member: OrganizationMember) -> OrganizationMember:
        self.db.add(member)
        await self.db.commit()
        await self.db.refresh(member)
        return member

    async def update(self, member: OrganizationMember) -> OrganizationMember:
        await self.db.commit()
        await self.db.refresh(member)
        return member

    async def delete(self, member: OrganizationMember) -> None:
        await self.db.delete(member)
        await self.db.commit()

    async def get_member_with_user(
        self,
        organization_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> tuple[OrganizationMember, User] | None:
        result = await self.db.execute(
            select(OrganizationMember, User)
            .join(User, User.id == OrganizationMember.user_id)
            .where(
                OrganizationMember.organization_id == organization_id,
                OrganizationMember.user_id == user_id,
            )
        )
        row = result.one_or_none()
        if row is None:
            return None
        return row.tuple()
