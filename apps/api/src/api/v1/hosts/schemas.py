import uuid
from datetime import datetime
from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class VerificationMethodEnum(str, Enum):
    """Domain ownership verification method."""

    dns = "dns"
    http = "http"


class CreateHostRequest(BaseModel):
    """Register a domain as a load test target."""

    model_config = ConfigDict(title="Create Host")

    url: str = Field(
        ...,
        min_length=1,
        max_length=2048,
        description="Hostname or URL of the target (scheme optional).",
    )
    verification_method: VerificationMethodEnum = Field(
        description="Verification method: DNS TXT record or HTTP file.",
    )


class DnsInstructions(BaseModel):
    method: Literal["dns"] = "dns"
    record_type: str = "TXT"
    record_name: str = Field(description="DNS record name to create.")
    record_value: str = Field(description="DNS record value.")


class HttpInstructions(BaseModel):
    method: Literal["http"] = "http"
    file_urls: list[str] = Field(description="URLs where the verification file must be reachable.")
    file_body: str = Field(description="Exact content of the verification file.")


class HostResponse(BaseModel):
    """Verified or pending load test target host."""

    model_config = ConfigDict(title="Host")

    id: uuid.UUID = Field(description="Host identifier.")
    hostname: str = Field(description="Normalized hostname.")
    original_input: str = Field(description="Value submitted at registration.")
    verification_method: str = Field(description="Verification method in use.")
    status: str = Field(description="Verification status: `pending`, `verified`, or `failed`.")
    verification_deadline: datetime = Field(description="Verification attempt deadline (UTC).")
    verification_started_at: datetime = Field(description="When verification started (UTC).")
    last_checked_at: datetime | None = Field(
        default=None,
        description="Timestamp of the most recent verification check.",
    )
    last_check_error: str | None = Field(
        default=None,
        description="Most recent verification error, if any.",
    )
    check_count: int = Field(description="Number of verification checks performed.")
    verified_at: datetime | None = Field(
        default=None,
        description="When the host was verified (UTC).",
    )
    failed_at: datetime | None = Field(
        default=None,
        description="When verification failed (UTC).",
    )
    created_at: datetime
    updated_at: datetime
    instructions: dict = Field(
        description="DNS or HTTP instructions required to complete verification.",
    )


class MessageResponse(BaseModel):
    message: str = Field(description="Human-readable result message.")
