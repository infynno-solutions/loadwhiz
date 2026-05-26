import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CompleteOnboardingRequest(BaseModel):
    model_config = ConfigDict(title="Complete Onboarding")

    name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Name for the initial organization.",
    )


class OnboardingOrganizationResponse(BaseModel):
    id: uuid.UUID = Field(description="Organization identifier.")
    name: str = Field(description="Organization name.")
    slug: str = Field(description="URL-safe organization slug.")
    created_at: datetime
    updated_at: datetime


class OnboardingUserResponse(BaseModel):
    id: uuid.UUID = Field(description="User identifier.")
    onboarding_completed: bool = Field(description="Whether onboarding is complete.")
    active_organization_id: uuid.UUID | None = Field(
        default=None,
        description="Currently selected organization.",
    )


class CompleteOnboardingResponse(BaseModel):
    model_config = ConfigDict(title="Onboarding Result")

    organization: OnboardingOrganizationResponse
    user: OnboardingUserResponse
