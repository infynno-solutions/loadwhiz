from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.v1.users.schemas import (
    SetActiveOrganizationRequest,
    UserBootstrapResponse,
    UserMeResponse,
)
from src.core.dependencies import get_current_user
from src.db.session import get_db
from src.models.user import User
from src.repositories.organization_member_repository import OrganizationMemberRepository
from src.repositories.user_repository import UserRepository
from src.services.user_service import UserService

router = APIRouter(
    prefix="/users",
    tags=["users"],
)


def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    return UserService(
        user_repository=UserRepository(db),
        member_repository=OrganizationMemberRepository(db),
    )


@router.get(
    "/me",
    operation_id="users.me",
    response_model=UserMeResponse,
    summary="Get current user profile",
    description="Returns the authenticated user's profile, organization memberships, and active organization.",
    responses={401: {"description": "Authentication required."}},
)
async def get_me(
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user),
) -> UserMeResponse:
    return await service.get_me(current_user)


@router.patch(
    "/me/active-organization",
    operation_id="users.set_active_organization",
    response_model=UserBootstrapResponse,
    summary="Set active organization",
    description="Set the organization used as the default workspace for the authenticated user.",
    responses={
        401: {"description": "Authentication required."},
        403: {"description": "Not a member of the organization."},
    },
)
async def set_active_organization(
    body: SetActiveOrganizationRequest,
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user),
) -> UserBootstrapResponse:
    return await service.set_active_organization(current_user, body.organization_id)
