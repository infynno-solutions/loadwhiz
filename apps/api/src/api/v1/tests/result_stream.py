from __future__ import annotations

import asyncio
import json
import threading
from collections.abc import AsyncIterator
from typing import Any

import redis

from src.core.config import settings
from src.models.load_test import LoadTestResultStatus
from src.services.load_test_run_service import LoadTestRunService
from src.services.result_events import parse_result_event, result_channel

_TERMINAL = {
    LoadTestResultStatus.ready.value,
    LoadTestResultStatus.failed.value,
    LoadTestResultStatus.cancelled.value,
}


def _format_sse(event: str, data: dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(data, default=str)}\n\n"


def _pubsub_listener(
    pubsub: redis.client.PubSub,
    queue: asyncio.Queue[str | None],
    loop: asyncio.AbstractEventLoop,
) -> None:
    try:
        for message in pubsub.listen():
            if message.get("type") != "message":
                continue
            data = message.get("data")
            if isinstance(data, bytes):
                data = data.decode("utf-8")
            if isinstance(data, str):
                asyncio.run_coroutine_threadsafe(queue.put(data), loop)
    finally:
        asyncio.run_coroutine_threadsafe(queue.put(None), loop)


async def iter_result_stream(
    service: LoadTestRunService,
    organization_id,
    test_id,
    result_id,
) -> AsyncIterator[str]:
    """Server-sent events for live load test result updates."""
    dashboard = await service.get_result_dashboard(
        organization_id,
        test_id,
        result_id,
    )
    result = await service.get_result(organization_id, test_id, result_id)
    yield _format_sse(
        "snapshot",
        {"dashboard": dashboard, "result": result},
    )

    if result["status"] in _TERMINAL:
        yield _format_sse("done", {"status": result["status"], "passed": result.get("passed")})
        return

    channel = result_channel(str(result_id))
    client = redis.from_url(settings.celery_broker_url, decode_responses=True)
    pubsub = client.pubsub(ignore_subscribe_messages=True)
    pubsub.subscribe(channel)

    queue: asyncio.Queue[str | None] = asyncio.Queue()
    loop = asyncio.get_running_loop()
    thread = threading.Thread(
        target=_pubsub_listener,
        args=(pubsub, queue, loop),
        daemon=True,
    )
    thread.start()

    try:
        while True:
            try:
                raw = await asyncio.wait_for(queue.get(), timeout=20.0)
            except TimeoutError:
                yield _format_sse("heartbeat", {})
                continue

            if raw is None:
                break

            parsed = parse_result_event(raw)
            if not parsed:
                continue

            event_type, payload = parsed
            yield _format_sse(event_type, payload)

            if event_type == "done":
                break
            status = payload.get("status")
            if isinstance(status, str) and status in _TERMINAL:
                break
    finally:
        try:
            pubsub.unsubscribe(channel)
            pubsub.close()
        except Exception:
            pass
        client.close()
