import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status

from src.core.slug import generate_unique_slug
from src.models.organization import Organization
from src.models.organization_member import MemberRole, OrganizationMember
from src.models.user import User
from src.repositories.auth_repository import AuthRepository
from src.repositories.organization_member_repository import OrganizationMemberRepository
from src.repositories.organization_repository import OrganizationRepository


class OrganizationService:
    def __init__(
        self,
        organization_repository: OrganizationRepository,
        member_repository: OrganizationMemberRepository,
        auth_repository: AuthRepository,
    ):
        self.organization_repository = organization_repository
        self.member_repository = member_repository
        self.auth_repository = auth_repository

    async def list_organizations(self, user: User) -> list[dict]:
        rows = await self.member_repository.list_organizations_for_user(user.id)
        return [
            {
                **self._org_to_dict(org),
                "role": member.role.value,
                "joined_at": member.joined_at,
            }
            for org, member in rows
        ]

    async def create_organization(self, user: User, name: str) -> dict:
        slug = await generate_unique_slug(
            name,
            self.organization_repository.slug_exists,
        )

        db = self.organization_repository.db
        organization = Organization(name=name, slug=slug)
        db.add(organization)
        await db.flush()

        member = OrganizationMember(
            organization_id=organization.id,
            user_id=user.id,
            role=MemberRole.owner,
            joined_at=datetime.now(UTC),
        )
        db.add(member)

        await db.commit()
        await db.refresh(organization)

        if not user.active_organization_id:
            user.active_organization_id = organization.id
            await self.auth_repository.update_user(user)

        return self._org_to_dict(organization)

    async def get_organization(
        self,
        organization_id: uuid.UUID,
    ) -> Organization:
        organization = await self.organization_repository.get_by_id(organization_id)
        if not organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found",
            )
        return organization

    async def update_organization(
        self,
        organization: Organization,
        name: str,
    ) -> dict:
        organization.name = name
        organization.slug = await generate_unique_slug(
            name,
            lambda s: self.organization_repository.slug_exists(
                s, exclude_id=organization.id
            ),
        )
        organization.updated_at = datetime.now(UTC)
        organization = await self.organization_repository.update(organization)
        return self._org_to_dict(organization)

    async def delete_organization(self, organization: Organization) -> dict:
        await self.organization_repository.delete(organization)
        return {"message": "Organization deleted successfully"}

    async def list_members(self, organization_id: uuid.UUID) -> list[dict]:
        members = await self.member_repository.list_by_organization(organization_id)
        result = []
        for member in members:
            user = await self.auth_repository.get_user_by_id(member.user_id)
            if not user:
                continue
            result.append(
                {
                    "user_id": member.user_id,
                    "name": user.name,
                    "email": user.email,
                    "role": member.role.value,
                    "joined_at": member.joined_at,
                }
            )
        return result

    async def update_member_role(
        self,
        organization_id: uuid.UUID,
        target_user_id: uuid.UUID,
        role: MemberRole,
    ) -> dict:
        if role == MemberRole.owner:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Use ownership transfer to assign owner role",
            )

        target = await self.member_repository.get_membership(
            organization_id, target_user_id
        )
        if not target:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Member not found",
            )

        if target.role == MemberRole.owner:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot change role of an owner",
            )

        target.role = role
        await self.member_repository.update(target)

        return {
            "user_id": target.user_id,
            "role": target.role.value,
        }

    async def remove_member(
        self,
        organization_id: uuid.UUID,
        target_user_id: uuid.UUID,
        actor: OrganizationMember,
    ) -> dict:
        target = await self.member_repository.get_membership(
            organization_id, target_user_id
        )
        if not target:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Member not found",
            )

        if target.role == MemberRole.owner:
            if actor.role != MemberRole.owner:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only owners can remove owners",
                )
            owner_count = await self.member_repository.count_owners(organization_id)
            if owner_count <= 1:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Cannot remove the last owner",
                )

        user = await self.auth_repository.get_user_by_id(target_user_id)
        if user and user.active_organization_id == organization_id:
            user.active_organization_id = None
            await self.auth_repository.update_user(user)

        await self.member_repository.delete(target)

        return {"message": "Member removed successfully"}

    @staticmethod
    def _org_to_dict(organization: Organization) -> dict:
        return {
            "id": organization.id,
            "name": organization.name,
            "slug": organization.slug,
            "created_at": organization.created_at,
            "updated_at": organization.updated_at,
        }
