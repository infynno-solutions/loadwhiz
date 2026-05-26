from __future__ import annotations

import statistics
from typing import Any, Protocol


class _NdjsonMetricsLike(Protocol):
    buckets: dict[int, Any]
    durations: list[float]


def extract_metrics_from_ndjson(
    ndjson: _NdjsonMetricsLike,
    *,
    duration_seconds: int | None = None,
) -> dict[str, Any]:
    """Derive summary metrics from partial NDJSON while a run is still active."""
    total_requests = sum(bucket.requests for bucket in ndjson.buckets.values())
    errors = sum(bucket.errors for bucket in ndjson.buckets.values())

    if total_requests == 0 and ndjson.durations:
        total_requests = len(ndjson.durations)

    error_rate_percent = 0.0
    if total_requests > 0:
        error_rate_percent = round((errors / total_requests) * 100, 2)

    avg_ms = None
    if ndjson.durations:
        avg_ms = round(statistics.mean(ndjson.durations), 2)

    p95_ms = None
    if len(ndjson.durations) >= 2:
        sorted_d = sorted(ndjson.durations)
        idx = max(0, int(len(sorted_d) * 0.95) - 1)
        p95_ms = round(sorted_d[idx], 2)
    elif ndjson.durations:
        p95_ms = round(ndjson.durations[0], 2)

    elapsed = duration_seconds
    if elapsed is None and ndjson.buckets:
        elapsed = max(ndjson.buckets.keys()) + 1
    elapsed = elapsed or 0

    rps = 0.0
    if elapsed > 0 and total_requests > 0:
        rps = round(total_requests / elapsed, 2)

    return {
        "total_requests": total_requests,
        "error_rate_percent": error_rate_percent,
        "rps": rps,
        "p95_ms": p95_ms,
        "avg_ms": avg_ms,
        "duration_seconds": float(elapsed) if elapsed else None,
    }
