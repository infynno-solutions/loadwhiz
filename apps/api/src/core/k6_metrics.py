from __future__ import annotations

from typing import Any


def _metric_values(metric: dict[str, Any]) -> dict[str, Any]:
    values = metric.get("values")
    if isinstance(values, dict):
        return values
    return metric


def _metric_count(metric: dict[str, Any]) -> int:
    values = _metric_values(metric)
    count = values.get("count")
    if count is not None:
        return int(count)
    value = values.get("value")
    if value is not None:
        return int(value)
    return 0


def _metric_rate(metric: dict[str, Any]) -> float:
    values = _metric_values(metric)
    rate = values.get("rate")
    if rate is not None:
        return float(rate)
    return 0.0


def _http_req_failed_rate(metric: dict[str, Any]) -> float:
    """Failure ratio from k6's http_req_failed rate metric.

    Summary export uses ``value`` for the ratio; ``rate`` may be absent. For this
    metric, ``passes`` counts failed requests (non-zero samples) and ``fails``
    counts successful ones — see grafana/k6#2306.
    """
    values = _metric_values(metric)
    for key in ("rate", "value"):
        raw = values.get(key)
        if raw is not None:
            return float(raw)
    passes = values.get("passes")
    fails = values.get("fails")
    if passes is not None and fails is not None:
        total = int(passes) + int(fails)
        if total > 0:
            return int(passes) / total
    return 0.0


def extract_metrics(summary: dict[str, Any]) -> dict[str, Any]:
    metrics_root = summary.get("metrics") or {}
    http_reqs = metrics_root.get("http_reqs") or {}
    http_failed = metrics_root.get("http_req_failed") or {}
    duration = metrics_root.get("http_req_duration") or {}
    iterations = metrics_root.get("iterations") or {}

    total_requests = _metric_count(http_reqs)
    if total_requests == 0:
        total_requests = _metric_count(iterations)

    failed_rate = _http_req_failed_rate(http_failed)
    error_rate_percent = round(failed_rate * 100, 2)

    duration_values = _metric_values(duration)
    p95 = duration_values.get("p(95)")
    avg = duration_values.get("avg")

    state = summary.get("state") or {}
    duration_seconds = state.get("testRunDurationMs")
    if duration_seconds is not None:
        duration_seconds = round(float(duration_seconds) / 1000, 2)
    elif state.get("testRunDuration") is not None:
        duration_seconds = round(float(state["testRunDuration"]) / 1_000_000_000, 2)

    rps = _metric_rate(http_reqs)
    if rps == 0.0 and duration_seconds and duration_seconds > 0 and total_requests > 0:
        rps = round(total_requests / duration_seconds, 2)

    return {
        "total_requests": total_requests,
        "error_rate_percent": error_rate_percent,
        "rps": round(rps, 2),
        "p95_ms": round(float(p95), 2) if p95 is not None else None,
        "avg_ms": round(float(avg), 2) if avg is not None else None,
        "duration_seconds": duration_seconds,
    }


def evaluate_passed(
    metrics: dict[str, Any],
    error_threshold_percent: int,
    *,
    has_summary: bool = True,
) -> bool:
    if not has_summary:
        return False
    if metrics.get("total_requests", 0) <= 0:
        return False
    return metrics.get("error_rate_percent", 100) <= error_threshold_percent
