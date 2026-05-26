from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.v1.auth.schemas import MessageResponse
from src.api.v1.users.schemas import (
    ChangePasswordRequest,
    SetActiveOrganizationRequest,
    UpdateMeRequest,
    UserBootstrapResponse,
    UserMeResponse,
)
from src.core.dependencies import get_current_user
from src.db.session import get_db
from src.models.user import User
from src.repositories.auth_repository import AuthRepository
from src.repositories.organization_member_repository import OrganizationMemberRepository
from src.repositories.session_repository import SessionRepository
from src.repositories.user_repository import UserRepository
from src.repositories.verification_token_repository import VerificationTokenRepository
from src.services.auth_service import AuthService
from src.services.email_service import EmailService
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


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(
        auth_repository=AuthRepository(db),
        session_repository=SessionRepository(db),
        verification_token_repository=VerificationTokenRepository(db),
        email_service=EmailService(),
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
    "/me",
    operation_id="users.update_me",
    response_model=UserMeResponse,
    summary="Update current user profile",
    description="Update the authenticated user's profile fields.",
    responses={
        401: {"description": "Authentication required."},
        400: {"description": "Invalid request."},
    },
)
async def update_me(
    body: UpdateMeRequest,
    service: UserService = Depends(get_user_service),
    current_user: User = Depends(get_current_user),
) -> UserMeResponse:
    return await service.update_me(current_user, body.name)


@router.post(
    "/me/change-password",
    operation_id="users.change_password",
    response_model=MessageResponse,
    summary="Change password",
    description="Change the authenticated user's password. Revokes all active sessions.",
    responses={
        401: {"description": "Authentication required."},
        400: {"description": "Current password is incorrect."},
    },
)
async def change_password(
    body: ChangePasswordRequest,
    service: AuthService = Depends(get_auth_service),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    return await service.change_password(
        current_user,
        body.current_password,
        body.new_password,
    )


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
