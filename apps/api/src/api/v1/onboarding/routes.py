from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.v1.onboarding.schemas import (
    CompleteOnboardingRequest,
    CompleteOnboardingResponse,
)
from src.core.dependencies import get_current_user
from src.db.session import get_db
from src.models.user import User
from src.repositories.auth_repository import AuthRepository
from src.repositories.organization_member_repository import OrganizationMemberRepository
from src.repositories.organization_repository import OrganizationRepository
from src.services.onboarding_service import OnboardingService

router = APIRouter(
    prefix="/onboarding",
    tags=["onboarding"],
)


def get_onboarding_service(db: AsyncSession = Depends(get_db)) -> OnboardingService:
    return OnboardingService(
        organization_repository=OrganizationRepository(db),
        member_repository=OrganizationMemberRepository(db),
        auth_repository=AuthRepository(db),
    )


@router.post(
    "/organization",
    operation_id="onboarding.complete_organization",
    status_code=status.HTTP_201_CREATED,
    response_model=CompleteOnboardingResponse,
    summary="Complete organization onboarding",
    description=(
        "Create the user's first organization and mark onboarding as complete. "
        "Available only while onboarding has not been completed."
    ),
    responses={
        401: {"description": "Authentication required."},
        409: {"description": "Onboarding is already completed."},
    },
)
async def complete_organization_onboarding(
    body: CompleteOnboardingRequest,
    service: OnboardingService = Depends(get_onboarding_service),
    current_user: User = Depends(get_current_user),
) -> CompleteOnboardingResponse:
    return await service.complete_organization_onboarding(current_user, body.name)
