import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class MemberRoleEnum(str, Enum):
    """Organization member role."""

    owner = "owner"
    admin = "admin"
    member = "member"


class OrganizationResponse(BaseModel):
    model_config = ConfigDict(title="Organization")

    id: uuid.UUID = Field(description="Organization identifier.")
    name: str = Field(description="Organization name.")
    slug: str = Field(description="URL-safe organization slug.")
    created_at: datetime
    updated_at: datetime


class OrganizationWithRoleResponse(OrganizationResponse):
    role: str = Field(description="Caller role in this organization.")
    joined_at: datetime = Field(description="When the caller joined (UTC).")


class CreateOrganizationRequest(BaseModel):
    model_config = ConfigDict(title="Create Organization")

    name: str = Field(..., min_length=1, max_length=255, description="Organization name.")


class UpdateOrganizationRequest(BaseModel):
    model_config = ConfigDict(title="Update Organization")

    name: str = Field(..., min_length=1, max_length=255, description="Organization name.")


class MemberResponse(BaseModel):
    user_id: uuid.UUID = Field(description="Member user identifier.")
    name: str
    email: EmailStr
    role: str = Field(description="Member role: `owner`, `admin`, or `member`.")
    joined_at: datetime


class UpdateMemberRoleRequest(BaseModel):
    model_config = ConfigDict(title="Update Member Role")

    role: MemberRoleEnum = Field(description="New member role.")


class UpdateMemberRoleResponse(BaseModel):
    model_config = ConfigDict(title="Member Role Update")

    user_id: uuid.UUID = Field(description="Member user identifier.")
    role: str = Field(description="Updated member role.")


class CreateInviteRequest(BaseModel):
    email: EmailStr = Field(description="Email address to invite.")
    role: MemberRoleEnum = Field(
        default=MemberRoleEnum.member,
        description="Role granted upon acceptance.",
    )


class InviteResponse(BaseModel):
    id: uuid.UUID = Field(description="Invite identifier.")
    organization_id: uuid.UUID
    email: EmailStr
    role: str
    status: str = Field(description="Invite status.")
    expires_at: datetime
    created_at: datetime


class MessageResponse(BaseModel):
    message: str = Field(description="Human-readable result message.")
