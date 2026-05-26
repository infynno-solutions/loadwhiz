import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.v1.organizations.schemas import (
    CreateInviteRequest,
    CreateOrganizationRequest,
    InviteResponse,
    MemberResponse,
    MessageResponse,
    OrgDashboardResponse,
    OrganizationResponse,
    OrganizationWithRoleResponse,
    UpdateMemberRoleRequest,
    UpdateMemberRoleResponse,
    UpdateOrganizationRequest,
)
from src.core.dependencies import get_current_user
from src.core.org_dependencies import get_org_member, require_org_roles
from src.db.session import get_db
from src.models.organization_member import MemberRole, OrganizationMember
from src.models.user import User
from src.repositories.auth_repository import AuthRepository
from src.repositories.host_repository import HostRepository
from src.repositories.load_test_repository import LoadTestRepository
from src.repositories.load_test_result_repository import LoadTestResultRepository
from src.repositories.organization_invite_repository import OrganizationInviteRepository
from src.repositories.organization_member_repository import OrganizationMemberRepository
from src.repositories.organization_repository import OrganizationRepository
from src.services.dashboard_service import DashboardService
from src.services.email_service import EmailService
from src.services.invite_service import InviteService
from src.services.organization_service import OrganizationService

router = APIRouter(
    prefix="/organizations",
    tags=["organizations"],
)


def get_organization_service(db: AsyncSession = Depends(get_db)) -> OrganizationService:
    return OrganizationService(
        organization_repository=OrganizationRepository(db),
        member_repository=OrganizationMemberRepository(db),
        auth_repository=AuthRepository(db),
    )


def get_dashboard_service(db: AsyncSession = Depends(get_db)) -> DashboardService:
    return DashboardService(
        test_repository=LoadTestRepository(db),
        result_repository=LoadTestResultRepository(db),
        host_repository=HostRepository(db),
    )


def get_invite_service(db: AsyncSession = Depends(get_db)) -> InviteService:
    return InviteService(
        invite_repository=OrganizationInviteRepository(db),
        member_repository=OrganizationMemberRepository(db),
        organization_repository=OrganizationRepository(db),
        auth_repository=AuthRepository(db),
        email_service=EmailService(),
    )


@router.get(
    "",
    operation_id="organizations.list",
    response_model=list[OrganizationWithRoleResponse],
    summary="List organizations",
    description="Returns organizations the authenticated user belongs to, including role and join date.",
    responses={401: {"description": "Authentication required."}},
)
async def list_organizations(
    service: OrganizationService = Depends(get_organization_service),
    current_user: User = Depends(get_current_user),
) -> list[OrganizationWithRoleResponse]:
    return await service.list_organizations(current_user)


@router.post(
    "",
    operation_id="organizations.create",
    status_code=status.HTTP_201_CREATED,
    response_model=OrganizationResponse,
    summary="Create organization",
    description="Create a new organization. The authenticated user becomes the owner.",
    responses={
        401: {"description": "Authentication required."},
        409: {"description": "Organization slug conflict."},
    },
)
async def create_organization(
    body: CreateOrganizationRequest,
    service: OrganizationService = Depends(get_organization_service),
    current_user: User = Depends(get_current_user),
) -> OrganizationResponse:
    return await service.create_organization(current_user, body.name)


@router.get(
    "/{org_id}",
    operation_id="organizations.get",
    response_model=OrganizationResponse,
    summary="Get organization",
    description="Retrieve organization details. Requires membership in the organization.",
    responses={
        401: {"description": "Authentication required."},
        403: {"description": "Not a member of this organization."},
        404: {"description": "Organization not found."},
    },
)
async def get_organization(
    org_id: uuid.UUID,
    service: OrganizationService = Depends(get_organization_service),
    _membership: OrganizationMember = Depends(get_org_member),
) -> OrganizationResponse:
    organization = await service.get_organization(org_id)
    return OrganizationResponse(
        id=organization.id,
        name=organization.name,
        slug=organization.slug,
        created_at=organization.created_at,
        updated_at=organization.updated_at,
    )


@router.get(
    "/{org_id}/dashboard",
    operation_id="organizations.dashboard",
    response_model=OrgDashboardResponse,
    summary="Get organization dashboard",
    description=(
        "Returns aggregated stats, a performance highlight for the most recent run, "
        "and the 10 most recent test runs across the organization."
    ),
    responses={
        401: {"description": "Authentication required."},
        403: {"description": "Not a member of this organization."},
        404: {"description": "Organization not found."},
    },
)
async def get_org_dashboard(
    org_id: uuid.UUID,
    service: DashboardService = Depends(get_dashboard_service),
    _membership: OrganizationMember = Depends(get_org_member),
) -> OrgDashboardResponse:
    return await service.get_org_dashboard(org_id)


@router.patch(
    "/{org_id}",
    operation_id="organizations.update",
    response_model=OrganizationResponse,
    summary="Update organization",
    description="Update organization settings. Requires the owner or admin role.",
    responses={
        401: {"description": "Authentication required."},
        403: {"description": "Insufficient permissions."},
        404: {"description": "Organization not found."},
    },
)
async def update_organization(
    org_id: uuid.UUID,
    body: UpdateOrganizationRequest,
    service: OrganizationService = Depends(get_organization_service),
    _membership: OrganizationMember = Depends(
        require_org_roles(MemberRole.owner, MemberRole.admin)
    ),
) -> OrganizationResponse:
    organization = await service.get_organization(org_id)
    return await service.update_organization(organization, body.name)


@router.delete(
    "/{org_id}",
    operation_id="organizations.delete",
    response_model=MessageResponse,
    summary="Delete organization",
    description="Permanently delete an organization. Requires the owner role.",
    responses={
        401: {"description": "Authentication required."},
        403: {"description": "Insufficient permissions."},
        404: {"description": "Organization not found."},
    },
)
async def delete_organization(
    org_id: uuid.UUID,
    service: OrganizationService = Depends(get_organization_service),
    _membership: OrganizationMember = Depends(require_org_roles(MemberRole.owner)),
) -> MessageResponse:
    organization = await service.get_organization(org_id)
    return await service.delete_organization(organization)


@router.get(
    "/{org_id}/members",
    operation_id="organizations.members.list",
    response_model=list[MemberResponse],
    summary="List organization members",
    description="Returns all members of the organization.",
    responses={
        401: {"description": "Authentication required."},
        403: {"description": "Not a member of this organization."},
    },
)
async def list_members(
    org_id: uuid.UUID,
    service: OrganizationService = Depends(get_organization_service),
    _membership: OrganizationMember = Depends(get_org_member),
) -> list[MemberResponse]:
    return await service.list_members(org_id)


@router.patch(
    "/{org_id}/members/{user_id}",
    operation_id="organizations.members.update_role",
    response_model=UpdateMemberRoleResponse,
    summary="Update member role",
    description="Change a member's role. Requires the owner role. The owner role cannot be assigned via this endpoint.",
    responses={
        400: {"description": "Invalid role change."},
        401: {"description": "Authentication required."},
        403: {"description": "Insufficient permissions."},
        404: {"description": "Member not found."},
    },
)
async def update_member_role(
    org_id: uuid.UUID,
    user_id: uuid.UUID,
    body: UpdateMemberRoleRequest,
    service: OrganizationService = Depends(get_organization_service),
    _membership: OrganizationMember = Depends(require_org_roles(MemberRole.owner)),
) -> UpdateMemberRoleResponse:
    result = await service.update_member_role(org_id, user_id, MemberRole(body.role.value))
    return UpdateMemberRoleResponse(**result)


@router.delete(
    "/{org_id}/members/{user_id}",
    operation_id="organizations.members.remove",
    response_model=MessageResponse,
    summary="Remove member",
    description="Remove a member from the organization. Requires the owner or admin role.",
    responses={
        400: {"description": "Cannot remove the last owner."},
        401: {"description": "Authentication required."},
        403: {"description": "Insufficient permissions."},
        404: {"description": "Member not found."},
    },
)
async def remove_member(
    org_id: uuid.UUID,
    user_id: uuid.UUID,
    service: OrganizationService = Depends(get_organization_service),
    membership: OrganizationMember = Depends(
        require_org_roles(MemberRole.owner, MemberRole.admin)
    ),
) -> MessageResponse:
    return await service.remove_member(org_id, user_id, membership)


@router.post(
    "/{org_id}/invites",
    operation_id="organizations.invites.create",
    status_code=status.HTTP_201_CREATED,
    response_model=InviteResponse,
    summary="Create organization invite",
    description="Invite a user to join the organization by email. Requires the owner or admin role.",
    responses={
        401: {"description": "Authentication required."},
        403: {"description": "Insufficient permissions."},
        409: {"description": "User is already a member."},
    },
)
async def create_invite(
    org_id: uuid.UUID,
    body: CreateInviteRequest,
    service: InviteService = Depends(get_invite_service),
    current_user: User = Depends(get_current_user),
    _membership: OrganizationMember = Depends(
        require_org_roles(MemberRole.owner, MemberRole.admin)
    ),
) -> InviteResponse:
    return await service.create_invite(
        org_id, body.email, MemberRole(body.role.value), current_user
    )


@router.get(
    "/{org_id}/invites",
    operation_id="organizations.invites.list",
    response_model=list[InviteResponse],
    summary="List pending invites",
    description="Returns pending invitations for the organization. Requires the owner or admin role.",
    responses={
        401: {"description": "Authentication required."},
        403: {"description": "Insufficient permissions."},
    },
)
async def list_invites(
    org_id: uuid.UUID,
    service: InviteService = Depends(get_invite_service),
    _membership: OrganizationMember = Depends(
        require_org_roles(MemberRole.owner, MemberRole.admin)
    ),
) -> list[InviteResponse]:
    return await service.list_pending_invites(org_id)


@router.delete(
    "/{org_id}/invites/{invite_id}",
    operation_id="organizations.invites.revoke",
    response_model=MessageResponse,
    summary="Revoke invite",
    description="Revoke a pending invitation. Requires the owner or admin role.",
    responses={
        401: {"description": "Authentication required."},
        403: {"description": "Insufficient permissions."},
        404: {"description": "Invite not found."},
    },
)
async def revoke_invite(
    org_id: uuid.UUID,
    invite_id: uuid.UUID,
    service: InviteService = Depends(get_invite_service),
    _membership: OrganizationMember = Depends(
        require_org_roles(MemberRole.owner, MemberRole.admin)
    ),
) -> MessageResponse:
    return await service.revoke_invite(org_id, invite_id)
