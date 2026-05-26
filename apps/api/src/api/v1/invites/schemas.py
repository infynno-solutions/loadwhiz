import uuid

from pydantic import BaseModel, ConfigDict, Field


class InviteTokenRequest(BaseModel):
    model_config = ConfigDict(title="Invite Token")

    token: str = Field(..., min_length=1, description="Invitation token from the invite email.")


class AcceptInviteOrganizationResponse(BaseModel):
    id: uuid.UUID = Field(description="Organization identifier.")
    name: str = Field(description="Organization name.")
    slug: str = Field(description="URL-safe organization slug.")


class AcceptInviteUserResponse(BaseModel):
    onboarding_completed: bool = Field(description="Whether onboarding is complete.")
    active_organization_id: uuid.UUID | None = Field(
        default=None,
        description="Currently selected organization.",
    )


class AcceptInviteResponse(BaseModel):
    model_config = ConfigDict(title="Accept Invite Result")

    message: str = Field(description="Human-readable result message.")
    organization: AcceptInviteOrganizationResponse
    role: str = Field(description="Role granted in the organization.")
    user: AcceptInviteUserResponse


class MessageResponse(BaseModel):
    message: str = Field(description="Human-readable result message.")
