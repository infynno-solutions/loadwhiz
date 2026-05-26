import uuid
from collections.abc import Callable
from typing import Annotated

from fastapi import Depends, HTTPException, Path, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.dependencies import get_current_user, get_current_user_optional_bearer
from src.db.session import get_db
from src.models.organization_member import MemberRole, OrganizationMember
from src.models.user import User
from src.repositories.organization_member_repository import OrganizationMemberRepository
from src.repositories.organization_repository import OrganizationRepository


async def get_org_member(
    org_id: Annotated[uuid.UUID, Path()],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> OrganizationMember:
    org_repo = OrganizationRepository(db)
    organization = await org_repo.get_by_id(org_id)

    if not organization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Organization not found",
        )

    member_repo = OrganizationMemberRepository(db)
    membership = await member_repo.get_membership(org_id, current_user.id)

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not a member of this organization",
        )

    return membership


async def get_org_member_sse(
    org_id: Annotated[uuid.UUID, Path()],
    current_user: User = Depends(get_current_user_optional_bearer),
    db: AsyncSession = Depends(get_db),
) -> OrganizationMember:
    """Org membership check for SSE endpoints (query-string token support)."""
    return await get_org_member(org_id=org_id, current_user=current_user, db=db)


def require_org_roles(*roles: MemberRole) -> Callable:
    allowed = set(roles)

    async def checker(
        membership: OrganizationMember = Depends(get_org_member),
    ) -> OrganizationMember:
        if membership.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return membership

    return checker
