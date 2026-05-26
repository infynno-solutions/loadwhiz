from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.v1.invites.schemas import (
    AcceptInviteResponse,
    InviteTokenRequest,
    MessageResponse,
)
from src.core.dependencies import get_current_user
from src.db.session import get_db
from src.models.user import User
from src.repositories.auth_repository import AuthRepository
from src.repositories.organization_invite_repository import OrganizationInviteRepository
from src.repositories.organization_member_repository import OrganizationMemberRepository
from src.repositories.organization_repository import OrganizationRepository
from src.services.email_service import EmailService
from src.services.invite_service import InviteService

router = APIRouter(
    prefix="/invites",
    tags=["invites"],
)


def get_invite_service(db: AsyncSession = Depends(get_db)) -> InviteService:
    return InviteService(
        invite_repository=OrganizationInviteRepository(db),
        member_repository=OrganizationMemberRepository(db),
        organization_repository=OrganizationRepository(db),
        auth_repository=AuthRepository(db),
        email_service=EmailService(),
    )


@router.post(
    "/accept",
    operation_id="invites.accept",
    response_model=AcceptInviteResponse,
    summary="Accept organization invite",
    description="Accept an invitation and join the organization. The invite email must match the authenticated user's email.",
    responses={
        400: {"description": "Invite token is invalid or expired."},
        401: {"description": "Authentication required."},
        403: {"description": "Invite email does not match the authenticated user."},
        409: {"description": "User is already a member."},
    },
)
async def accept_invite(
    body: InviteTokenRequest,
    service: InviteService = Depends(get_invite_service),
    current_user: User = Depends(get_current_user),
) -> AcceptInviteResponse:
    return await service.accept_invite(current_user, body.token)


@router.post(
    "/decline",
    operation_id="invites.decline",
    response_model=MessageResponse,
    summary="Decline organization invite",
    description="Decline an invitation without joining the organization.",
    responses={
        400: {"description": "Invite token is invalid or expired."},
        401: {"description": "Authentication required."},
        403: {"description": "Invite email does not match the authenticated user."},
    },
)
async def decline_invite(
    body: InviteTokenRequest,
    service: InviteService = Depends(get_invite_service),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    return await service.decline_invite(current_user, body.token)
