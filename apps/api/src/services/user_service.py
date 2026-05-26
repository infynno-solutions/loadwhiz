import uuid

from fastapi import HTTPException, status

from src.models.user import User
from src.repositories.organization_member_repository import OrganizationMemberRepository
from src.repositories.user_repository import UserRepository
from src.services.user_bootstrap import build_user_bootstrap


class UserService:
    def __init__(
        self,
        user_repository: UserRepository,
        member_repository: OrganizationMemberRepository,
    ):
        self.user_repository = user_repository
        self.member_repository = member_repository

    async def get_me(self, user: User) -> dict:
        rows = await self.member_repository.list_organizations_for_user(user.id)
        organizations = [
            {
                "id": org.id,
                "name": org.name,
                "slug": org.slug,
                "role": member.role.value,
                "joined_at": member.joined_at,
            }
            for org, member in rows
        ]

        return {
            **build_user_bootstrap(user),
            "organizations": organizations,
        }

    async def set_active_organization(
        self,
        user: User,
        organization_id: uuid.UUID,
    ) -> dict:
        membership = await self.member_repository.get_membership(
            organization_id, user.id
        )
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not a member of this organization",
            )

        user.active_organization_id = organization_id
        user = await self.user_repository.update(user)

        return build_user_bootstrap(user)
