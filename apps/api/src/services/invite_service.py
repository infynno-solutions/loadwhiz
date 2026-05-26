import uuid
from datetime import UTC, datetime

from fastapi import HTTPException, status
from pydantic import EmailStr

from src.core.security import generate_token_id, get_invite_token_expiry
from src.models.organization_invite import InviteStatus, OrganizationInvite
from src.models.organization_member import MemberRole, OrganizationMember
from src.models.user import User
from src.repositories.auth_repository import AuthRepository
from src.repositories.organization_invite_repository import OrganizationInviteRepository
from src.repositories.organization_member_repository import OrganizationMemberRepository
from src.repositories.organization_repository import OrganizationRepository
from src.services.email_service import EmailService


class InviteService:
    def __init__(
        self,
        invite_repository: OrganizationInviteRepository,
        member_repository: OrganizationMemberRepository,
        organization_repository: OrganizationRepository,
        auth_repository: AuthRepository,
        email_service: EmailService,
    ):
        self.invite_repository = invite_repository
        self.member_repository = member_repository
        self.organization_repository = organization_repository
        self.auth_repository = auth_repository
        self.email_service = email_service

    async def create_invite(
        self,
        organization_id: uuid.UUID,
        email: EmailStr,
        role: MemberRole,
        invited_by: User,
    ) -> dict:
        if role == MemberRole.owner:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot invite as owner",
            )

        organization = await self.organization_repository.get_by_id(organization_id)
        if not organization:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Organization not found",
            )

        normalized_email = email.lower()
        existing_user = await self.auth_repository.get_user_by_email(normalized_email)
        if existing_user:
            membership = await self.member_repository.get_membership(
                organization_id, existing_user.id
            )
            if membership:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="User is already a member",
                )

        pending = await self.invite_repository.get_pending_by_email(
            organization_id, normalized_email
        )
        if pending:
            pending.status = InviteStatus.revoked
            await self.invite_repository.update(pending)

        token = generate_token_id()
        invite = OrganizationInvite(
            organization_id=organization_id,
            email=normalized_email,
            role=role,
            token=token,
            invited_by_user_id=invited_by.id,
            status=InviteStatus.pending,
            expires_at=get_invite_token_expiry(),
        )
        invite = await self.invite_repository.create(invite)

        await self.email_service.send_org_invite_email(
            to_email=normalized_email,
            inviter_name=invited_by.name,
            organization_name=organization.name,
            token=token,
        )

        return self._invite_to_dict(invite)

    async def list_pending_invites(self, organization_id: uuid.UUID) -> list[dict]:
        invites = await self.invite_repository.list_pending_by_organization(
            organization_id
        )
        return [self._invite_to_dict(invite) for invite in invites]

    async def revoke_invite(
        self,
        organization_id: uuid.UUID,
        invite_id: uuid.UUID,
    ) -> dict:
        invite = await self.invite_repository.get_by_id(invite_id)
        if not invite or invite.organization_id != organization_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invite not found",
            )

        if invite.status != InviteStatus.pending:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invite is not pending",
            )

        invite.status = InviteStatus.revoked
        await self.invite_repository.update(invite)

        return {"message": "Invite revoked successfully"}

    async def accept_invite(self, user: User, token: str) -> dict:
        invite = await self._get_valid_pending_invite(token)

        if invite.email.lower() != user.email.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invite email does not match your account",
            )

        existing = await self.member_repository.get_membership(
            invite.organization_id, user.id
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="You are already a member of this organization",
            )

        db = self.invite_repository.db
        member = OrganizationMember(
            organization_id=invite.organization_id,
            user_id=user.id,
            role=invite.role,
            joined_at=datetime.now(UTC),
        )
        db.add(member)

        invite.status = InviteStatus.accepted
        user.onboarding_completed = True
        if not user.active_organization_id:
            user.active_organization_id = invite.organization_id

        await db.commit()
        await db.refresh(member)
        await db.refresh(user)

        organization = await self.organization_repository.get_by_id(
            invite.organization_id
        )

        return {
            "message": "Invite accepted successfully",
            "organization": {
                "id": organization.id,
                "name": organization.name,
                "slug": organization.slug,
            },
            "role": member.role.value,
            "user": {
                "onboarding_completed": user.onboarding_completed,
                "active_organization_id": user.active_organization_id,
            },
        }

    async def decline_invite(self, user: User, token: str) -> dict:
        invite = await self._get_valid_pending_invite(token)

        if invite.email.lower() != user.email.lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invite email does not match your account",
            )

        invite.status = InviteStatus.declined
        await self.invite_repository.update(invite)

        return {"message": "Invite declined successfully"}

    async def _get_valid_pending_invite(self, token: str) -> OrganizationInvite:
        invite = await self.invite_repository.get_by_token(token)

        if not invite or invite.status != InviteStatus.pending:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired invite",
            )

        if invite.expires_at.replace(tzinfo=UTC) < datetime.now(UTC):
            invite.status = InviteStatus.expired
            await self.invite_repository.update(invite)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invite has expired",
            )

        return invite

    @staticmethod
    def _invite_to_dict(invite: OrganizationInvite) -> dict:
        return {
            "id": invite.id,
            "organization_id": invite.organization_id,
            "email": invite.email,
            "role": invite.role.value,
            "status": invite.status.value,
            "expires_at": invite.expires_at,
            "created_at": invite.created_at,
        }
