from __future__ import annotations

import uuid
from datetime import UTC, datetime, timedelta

from sqlalchemy import select

from src.core.config import settings
from src.models.host import Host, HostStatus
from src.services.host_verification import VerifyOutcome, verify_host_record
from src.workers.celery_app import app
from src.workers.db import get_sync_db


@app.task(name="src.workers.tasks.host_verification.verify_host", bind=True, max_retries=0)
def verify_host(self, host_id: str) -> dict:  # noqa: ANN001
    host_uuid = uuid.UUID(host_id)

    with get_sync_db() as db:
        host = db.get(Host, host_uuid)
        if host is None or host.status != HostStatus.pending:
            return {"skipped": True}

        result = verify_host_record(host)
        now = datetime.now(UTC)

        if result.outcome == VerifyOutcome.expired:
            host.status = HostStatus.failed
            host.failed_at = now
            host.updated_at = now
        elif result.outcome == VerifyOutcome.success:
            host.status = HostStatus.verified
            host.verified_at = now
            host.last_check_error = None
            host.updated_at = now
        else:
            host.check_count += 1
            host.last_checked_at = now
            host.last_check_error = result.error[:512] if result.error else None
            host.updated_at = now

    return {"outcome": result.outcome}


@app.task(name="src.workers.tasks.host_verification.sweep_pending_hosts")
def sweep_pending_hosts() -> dict:
    now = datetime.now(UTC)
    fast_window = timedelta(minutes=settings.host_verification_fast_window_minutes)
    fast_gap = timedelta(minutes=settings.host_verification_fast_interval_minutes)
    slow_gap = timedelta(minutes=settings.host_verification_slow_interval_minutes)

    enqueued = 0
    expired = 0

    with get_sync_db() as db:
        pending_hosts = db.scalars(
            select(Host).where(Host.status == HostStatus.pending)
        ).all()

        for host in pending_hosts:
            deadline = host.verification_deadline
            if deadline.tzinfo is None:
                deadline = deadline.replace(tzinfo=UTC)

            started_at = host.verification_started_at
            if started_at.tzinfo is None:
                started_at = started_at.replace(tzinfo=UTC)

            if now >= deadline:
                host.status = HostStatus.failed
                host.failed_at = now
                host.updated_at = now
                expired += 1
                continue

            age = now - started_at
            min_gap = fast_gap if age < fast_window else slow_gap

            last_checked = host.last_checked_at
            if last_checked is not None and last_checked.tzinfo is None:
                last_checked = last_checked.replace(tzinfo=UTC)

            due = last_checked is None or (now - last_checked) >= min_gap
            if due:
                verify_host.delay(str(host.id))
                enqueued += 1

    return {"enqueued": enqueued, "expired": expired}
