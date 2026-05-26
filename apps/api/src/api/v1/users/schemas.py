import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserOrganizationSummary(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    role: str = Field(description="Your role in the organization.")
    joined_at: datetime


class UserMeResponse(BaseModel):
    model_config = ConfigDict(title="Current User")

    id: uuid.UUID
    name: str
    email: EmailStr
    is_email_verified: bool
    onboarding_completed: bool
    active_organization_id: uuid.UUID | None = Field(
        default=None,
        description="Currently selected organization.",
    )
    organizations: list[UserOrganizationSummary] = Field(
        description="Organizations you belong to.",
    )


class SetActiveOrganizationRequest(BaseModel):
    organization_id: uuid.UUID = Field(description="Organization to set as active.")


class UserBootstrapResponse(BaseModel):
    id: uuid.UUID
    name: str
    email: EmailStr
    is_email_verified: bool
    onboarding_completed: bool
    active_organization_id: uuid.UUID | None = None
