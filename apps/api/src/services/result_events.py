from __future__ import annotations

import json
import logging
from typing import Any

import redis

from src.core.config import settings

logger = logging.getLogger(__name__)

RESULT_CHANNEL_PREFIX = "loadwhiz:result:"


def result_channel(result_id: str) -> str:
    return f"{RESULT_CHANNEL_PREFIX}{result_id}"


def _client() -> redis.Redis:
    return redis.from_url(settings.celery_broker_url, decode_responses=True)


def publish_result_event(
    result_id: str,
    event_type: str,
    payload: dict[str, Any] | None = None,
) -> None:
    """Publish a run progress event (metrics, dashboard, status, done)."""
    try:
        message = json.dumps({"type": event_type, "data": payload or {}})
        _client().publish(result_channel(result_id), message)
    except Exception:
        logger.exception("Failed to publish result event %s for %s", event_type, result_id)


def parse_result_event(message: dict[str, Any] | str | None) -> tuple[str, dict[str, Any]] | None:
    if message is None:
        return None
    if isinstance(message, str):
        try:
            parsed = json.loads(message)
        except json.JSONDecodeError:
            return None
    else:
        parsed = message
    if not isinstance(parsed, dict):
        return None
    event_type = parsed.get("type")
    if not isinstance(event_type, str):
        return None
    data = parsed.get("data")
    if not isinstance(data, dict):
        data = {}
    return event_type, data
