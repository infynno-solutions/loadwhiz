from datetime import UTC, datetime

from fastapi import HTTPException, status

from src.core.slug import generate_unique_slug
from src.models.organization import Organization
from src.models.organization_member import MemberRole, OrganizationMember
from src.models.user import User
from src.repositories.auth_repository import AuthRepository
from src.repositories.organization_member_repository import OrganizationMemberRepository
from src.repositories.organization_repository import OrganizationRepository


class OnboardingService:
    def __init__(
        self,
        organization_repository: OrganizationRepository,
        member_repository: OrganizationMemberRepository,
        auth_repository: AuthRepository,
    ):
        self.organization_repository = organization_repository
        self.member_repository = member_repository
        self.auth_repository = auth_repository

    async def complete_organization_onboarding(
        self,
        user: User,
        name: str,
    ) -> dict:
        if user.onboarding_completed:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Onboarding already completed",
            )

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

        user.onboarding_completed = True
        user.active_organization_id = organization.id

        await db.commit()
        await db.refresh(organization)
        await db.refresh(user)

        return {
            "organization": self._org_to_dict(organization),
            "user": {
                "id": user.id,
                "onboarding_completed": user.onboarding_completed,
                "active_organization_id": user.active_organization_id,
            },
        }

    @staticmethod
    def _org_to_dict(organization: Organization) -> dict:
        return {
            "id": organization.id,
            "name": organization.name,
            "slug": organization.slug,
            "created_at": organization.created_at,
            "updated_at": organization.updated_at,
        }
