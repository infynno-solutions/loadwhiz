import uuid
from datetime import datetime
from enum import Enum
from typing import Literal

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


# ---------------------------------------------------------------------------
# Organization dashboard
# ---------------------------------------------------------------------------


class OrgDashboardStats(BaseModel):
    model_config = ConfigDict(title="Org Dashboard Stats")

    total_tests: int = Field(description="Total load tests in the organization.")
    active_runs: int = Field(description="Currently active (pending/running) test runs.")
    draft_tests: int = Field(description="Tests with draft status.")
    failed_last_run: int = Field(description="Tests whose most recent result failed.")
    runs_last_7_days: int = Field(description="Test runs started in the last 7 days.")
    hosts_total: int = Field(description="Total registered hosts.")
    hosts_verified: int = Field(description="Verified hosts.")
    hosts_pending: int = Field(description="Hosts pending verification.")
    hosts_failed: int = Field(description="Hosts that failed verification.")


class OrgDashboardResultMetrics(BaseModel):
    total_requests: int = 0
    error_rate_percent: float = 0.0
    rps: float = 0.0
    avg_ms: float | None = None
    p95_ms: float | None = None


class OrgDashboardHighlight(BaseModel):
    model_config = ConfigDict(title="Org Dashboard Highlight")

    kind: Literal["active", "latest_completed"]
    test_id: uuid.UUID
    test_name: str
    host_hostname: str
    result_id: uuid.UUID
    status: str = Field(description="Load test result status.")
    passed: bool | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None
    metrics: OrgDashboardResultMetrics | None = None


class OrgDashboardRecentRun(BaseModel):
    result_id: uuid.UUID
    test_id: uuid.UUID
    test_name: str
    host_hostname: str
    status: str = Field(description="Load test result status.")
    passed: bool | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None
    metrics: OrgDashboardResultMetrics | None = None


class OrgDashboardResponse(BaseModel):
    model_config = ConfigDict(title="Org Dashboard")

    stats: OrgDashboardStats
    performance_highlight: OrgDashboardHighlight | None = None
    recent_runs: list[OrgDashboardRecentRun] = Field(default_factory=list)
