from __future__ import annotations

import enum
from datetime import UTC, datetime

from src.models.host import Host, HostStatus, VerificationMethod
from src.services.dns_verifier import check_dns_txt
from src.services.http_verifier import check_http_file


class VerifyOutcome(str, enum.Enum):
    success = "success"
    not_found = "not_found"
    error = "error"
    expired = "expired"
    already_verified = "already_verified"


class VerifyResult:
    def __init__(self, outcome: VerifyOutcome, error: str = "") -> None:
        self.outcome = outcome
        self.error = error

    @property
    def succeeded(self) -> bool:
        return self.outcome == VerifyOutcome.success


def verify_host_record(host: Host) -> VerifyResult:
    if host.status == HostStatus.verified:
        return VerifyResult(VerifyOutcome.already_verified)

    now = datetime.now(UTC)
    deadline = host.verification_deadline
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=UTC)

    if now >= deadline:
        return VerifyResult(VerifyOutcome.expired)

    if host.verification_method == VerificationMethod.dns:
        success, error = check_dns_txt(host.hostname, host.verification_token)
    else:
        success, error = check_http_file(host.hostname, host.verification_token)

    if success:
        return VerifyResult(VerifyOutcome.success)
    return VerifyResult(VerifyOutcome.not_found, error)
