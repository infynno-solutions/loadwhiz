from __future__ import annotations

import logging
from datetime import datetime
from uuid import UUID

import httpx

from src.services.email_service import EmailService

logger = logging.getLogger(__name__)


async def deliver_run_callbacks(
    *,
    test_id: UUID,
    result_id: UUID,
    test_name: str | None,
    callback_url: str | None,
    callback_email: str | None,
    passed: bool | None,
    metrics: dict | None,
    finished_at: datetime | None,
) -> None:
    payload = {
        "test_id": str(test_id),
        "result_id": str(result_id),
        "name": test_name,
        "passed": passed,
        "metrics": metrics,
        "finished_at": finished_at.isoformat() if finished_at else None,
    }

    if callback_url:
        await _post_webhook(callback_url, payload)

    if callback_email:
        await _send_completion_email(
            callback_email,
            test_name=test_name or str(test_id),
            passed=passed,
            metrics=metrics or {},
        )


async def _post_webhook(url: str, payload: dict) -> None:
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
    except Exception:
        logger.exception("Load test webhook delivery failed for %s", url)


async def _send_completion_email(
    to_email: str,
    *,
    test_name: str,
    passed: bool | None,
    metrics: dict,
) -> None:
    try:
        email_service = EmailService()
        await email_service.send_load_test_complete_email(
            to_email=to_email,
            test_name=test_name,
            passed=passed,
            metrics=metrics,
        )
    except Exception:
        logger.exception("Load test completion email failed for %s", to_email)


def deliver_run_callbacks_sync(**kwargs) -> None:
    import asyncio

    asyncio.run(deliver_run_callbacks(**kwargs))
