import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.v1.hosts.schemas import (
    CreateHostRequest,
    HostResponse,
    MessageResponse,
)
from src.core.org_dependencies import get_org_member, require_org_roles
from src.db.session import get_db
from src.models.organization_member import MemberRole, OrganizationMember
from src.models.host import VerificationMethod
from src.repositories.host_repository import HostRepository
from src.core.dependencies import get_current_user
from src.models.user import User
from src.services.host_service import HostService

router = APIRouter(
    tags=["hosts"],
)


def get_host_service(db: AsyncSession = Depends(get_db)) -> HostService:
    return HostService(host_repository=HostRepository(db))


@router.get(
    "",
    operation_id="hosts.list",
    response_model=list[HostResponse],
    summary="List hosts",
    description="List target hosts registered for the organization.",
)
async def list_hosts(
    org_id: uuid.UUID,
    service: HostService = Depends(get_host_service),
    _membership: OrganizationMember = Depends(get_org_member),
) -> list[HostResponse]:
    return await service.list_hosts(org_id)


@router.post(
    "",
    operation_id="hosts.create",
    status_code=status.HTTP_201_CREATED,
    response_model=HostResponse,
    summary="Register host",
    description="Register a domain for ownership verification before it can be used in load tests.",
    responses={
        409: {"description": "Hostname is already registered for this organization."},
        422: {"description": "Hostname is invalid or not allowed."},
    },
)
async def create_host(
    org_id: uuid.UUID,
    body: CreateHostRequest,
    service: HostService = Depends(get_host_service),
    current_user: User = Depends(get_current_user),
    _membership: OrganizationMember = Depends(
        require_org_roles(MemberRole.owner, MemberRole.admin)
    ),
) -> HostResponse:
    return await service.create_host(
        organization_id=org_id,
        created_by_user_id=current_user.id,
        url_input=body.url,
        verification_method=VerificationMethod(body.verification_method.value),
    )


@router.get(
    "/{host_id}",
    operation_id="hosts.get",
    response_model=HostResponse,
    summary="Get host",
    description="Retrieve host details, status, and verification instructions.",
    responses={404: {"description": "Host not found."}},
)
async def get_host(
    org_id: uuid.UUID,
    host_id: uuid.UUID,
    service: HostService = Depends(get_host_service),
    _membership: OrganizationMember = Depends(get_org_member),
) -> HostResponse:
    return await service.get_host(org_id, host_id)


@router.post(
    "/{host_id}/verify",
    operation_id="hosts.verify",
    response_model=HostResponse,
    summary="Verify host",
    description="Run an immediate verification check for a host in `pending` status.",
    responses={
        400: {"description": "Host is not in `pending` status."},
        404: {"description": "Host not found."},
    },
)
async def manual_verify(
    org_id: uuid.UUID,
    host_id: uuid.UUID,
    service: HostService = Depends(get_host_service),
    _membership: OrganizationMember = Depends(
        require_org_roles(MemberRole.owner, MemberRole.admin)
    ),
) -> HostResponse:
    return await service.manual_verify(org_id, host_id)


@router.post(
    "/{host_id}/retry",
    operation_id="hosts.retry",
    response_model=HostResponse,
    summary="Retry host verification",
    description="Reset verification for a `failed` host and start a new verification window.",
    responses={
        400: {"description": "Host is not in `failed` status."},
        404: {"description": "Host not found."},
    },
)
async def retry_host(
    org_id: uuid.UUID,
    host_id: uuid.UUID,
    service: HostService = Depends(get_host_service),
    _membership: OrganizationMember = Depends(
        require_org_roles(MemberRole.owner, MemberRole.admin)
    ),
) -> HostResponse:
    return await service.retry(org_id, host_id)


@router.delete(
    "/{host_id}",
    operation_id="hosts.delete",
    response_model=MessageResponse,
    summary="Delete host",
    description="Remove a host and its associated load test configurations.",
    responses={404: {"description": "Host not found."}},
)
async def delete_host(
    org_id: uuid.UUID,
    host_id: uuid.UUID,
    service: HostService = Depends(get_host_service),
    _membership: OrganizationMember = Depends(
        require_org_roles(MemberRole.owner, MemberRole.admin)
    ),
) -> MessageResponse:
    return await service.delete_host(org_id, host_id)
