from __future__ import annotations

import asyncio
import uuid
from datetime import UTC, datetime, timedelta

from fastapi import HTTPException, status

from src.core.config import settings
from src.core.host_validation import HostValidationError, parse_host_input
from src.core.security import generate_token_id
from src.models.host import Host, HostStatus, VerificationMethod
from src.repositories.host_repository import HostRepository
from src.services.host_verification import VerifyOutcome, verify_host_record
from src.workers.enqueue import enqueue_verify_host


class HostService:
    def __init__(self, host_repository: HostRepository):
        self.host_repository = host_repository

    async def create_host(
        self,
        organization_id: uuid.UUID,
        created_by_user_id: uuid.UUID,
        url_input: str,
        verification_method: VerificationMethod,
    ) -> dict:
        try:
            hostname = parse_host_input(url_input)
        except HostValidationError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(exc),
            ) from exc

        existing = await self.host_repository.get_by_org_and_hostname(
            organization_id, hostname
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Hostname '{hostname}' is already registered for this organization",
            )

        now = datetime.now(UTC)
        window = timedelta(hours=settings.host_verification_window_hours)
        token = generate_token_id()

        host = Host(
            organization_id=organization_id,
            hostname=hostname,
            original_input=url_input,
            verification_method=verification_method,
            status=HostStatus.pending,
            verification_token=token,
            verification_started_at=now,
            verification_deadline=now + window,
            check_count=0,
            created_by_user_id=created_by_user_id,
        )
        host = await self.host_repository.create(host)
        enqueue_verify_host(host.id)
        return self._to_dict(host)

    async def list_hosts(self, organization_id: uuid.UUID) -> list[dict]:
        hosts = await self.host_repository.list_by_organization(organization_id)
        return [self._to_dict(h) for h in hosts]

    async def get_host(
        self,
        organization_id: uuid.UUID,
        host_id: uuid.UUID,
    ) -> dict:
        host = await self._get_or_404(organization_id, host_id)
        return self._to_dict(host)

    async def manual_verify(
        self,
        organization_id: uuid.UUID,
        host_id: uuid.UUID,
    ) -> dict:
        host = await self._get_or_404(organization_id, host_id)

        if host.status != HostStatus.pending:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only pending hosts can be verified manually (current status: {host.status.value})",
            )

        result = await asyncio.to_thread(verify_host_record, host)
        now = datetime.now(UTC)

        if result.outcome == VerifyOutcome.expired:
            host.status = HostStatus.failed
            host.failed_at = now
        elif result.outcome == VerifyOutcome.success:
            host.status = HostStatus.verified
            host.verified_at = now
            host.last_check_error = None
        else:
            host.check_count += 1
            host.last_checked_at = now
            host.last_check_error = result.error[:512] if result.error else None

        host.updated_at = now
        host = await self.host_repository.update(host)
        return self._to_dict(host)

    async def retry(
        self,
        organization_id: uuid.UUID,
        host_id: uuid.UUID,
    ) -> dict:
        host = await self._get_or_404(organization_id, host_id)

        if host.status != HostStatus.failed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only failed hosts can be retried",
            )

        now = datetime.now(UTC)
        window = timedelta(hours=settings.host_verification_window_hours)
        host.status = HostStatus.pending
        host.verification_token = generate_token_id()
        host.verification_started_at = now
        host.verification_deadline = now + window
        host.failed_at = None
        host.last_check_error = None
        host.check_count = 0
        host.last_checked_at = None
        host.updated_at = now

        host = await self.host_repository.update(host)
        enqueue_verify_host(host.id)
        return self._to_dict(host)

    async def delete_host(
        self,
        organization_id: uuid.UUID,
        host_id: uuid.UUID,
    ) -> dict:
        host = await self._get_or_404(organization_id, host_id)
        await self.host_repository.delete(host)
        return {"message": "Host deleted successfully"}

    async def _get_or_404(self, organization_id: uuid.UUID, host_id: uuid.UUID) -> Host:
        host = await self.host_repository.get_by_id(host_id)
        if not host or host.organization_id != organization_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Host not found",
            )
        return host

    def _to_dict(self, host: Host) -> dict:
        return {
            "id": host.id,
            "hostname": host.hostname,
            "original_input": host.original_input,
            "verification_method": host.verification_method.value,
            "status": host.status.value,
            "verification_deadline": host.verification_deadline,
            "verification_started_at": host.verification_started_at,
            "last_checked_at": host.last_checked_at,
            "last_check_error": host.last_check_error,
            "check_count": host.check_count,
            "verified_at": host.verified_at,
            "failed_at": host.failed_at,
            "created_at": host.created_at,
            "updated_at": host.updated_at,
            "instructions": self._build_instructions(host),
        }

    def _build_instructions(self, host: Host) -> dict:
        token = host.verification_token
        hostname = host.hostname
        if host.verification_method == VerificationMethod.dns:
            prefix = settings.host_verification_dns_prefix
            return {
                "method": "dns",
                "record_type": "TXT",
                "record_name": f"{prefix}.{hostname}",
                "record_value": f"{prefix}={token}",
            }
        path = settings.host_verification_http_path
        return {
            "method": "http",
            "file_urls": [
                f"https://{hostname}{path}",
                f"http://{hostname}{path}",
            ],
            "file_body": token,
        }
