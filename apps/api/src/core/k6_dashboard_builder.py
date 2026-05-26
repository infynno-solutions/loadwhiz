from __future__ import annotations

import json
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any

from src.core.config import settings
from src.core.k6_metrics import extract_metrics, _metric_values
from src.models.load_test import LoadTest, LoadTestResult, LoadTestStatus, LoadTestType


def format_load_description(load_test: LoadTest) -> str:
    clients = load_test.total_clients
    seconds = load_test.duration_seconds
    if seconds >= 60 and seconds % 60 == 0:
        minutes = seconds // 60
        unit = "min" if minutes == 1 else "mins"
        return f"{clients} clients over {minutes} {unit}"
    return f"{clients} clients over {seconds} sec"


def build_dashboard_payload(
    load_test: LoadTest,
    result: LoadTestResult,
    summary: dict[str, Any] | None,
    *,
    ndjson_path: Path | None = None,
    bucket_seconds: int | None = None,
    distribution_bucket_ms: int | None = None,
    distribution_max_buckets: int | None = None,
) -> dict[str, Any]:
    bucket_seconds = bucket_seconds or settings.dashboard_bucket_seconds
    distribution_bucket_ms = (
        distribution_bucket_ms or settings.dashboard_distribution_bucket_ms
    )
    distribution_max_buckets = (
        distribution_max_buckets or settings.dashboard_distribution_max_buckets
    )

    metrics = extract_metrics(summary or {})
    ndjson = (
        parse_ndjson_metrics(ndjson_path)
        if ndjson_path and ndjson_path.exists()
        else NdjsonMetrics()
    )

    overview = {
        "avg_response_ms": metrics.get("avg_ms"),
        "error_rate_percent": metrics.get("error_rate_percent", 0.0),
        "total_requests": metrics.get("total_requests", 0),
        "rps": metrics.get("rps", 0.0),
    }

    aggregates = _build_aggregates(summary, metrics, ndjson)
    timeseries = _build_timeseries(
        ndjson,
        bucket_seconds=bucket_seconds,
        duration_seconds=load_test.duration_seconds,
    )
    by_url = _build_by_url(load_test, ndjson, summary)
    distribution = _build_distribution(
        ndjson,
        bucket_ms=distribution_bucket_ms,
        max_buckets=distribution_max_buckets,
    )

    can_abort = load_test.status in (LoadTestStatus.pending, LoadTestStatus.running)

    return {
        "version": 1,
        "meta": {
            "test_name": load_test.name or "Untitled test",
            "test_id": str(load_test.id),
            "result_id": str(result.id),
            "status": result.status.value,
            "passed": result.passed,
            "started_at": _iso(result.started_at),
            "finished_at": _iso(result.finished_at),
            "load_description": format_load_description(load_test),
            "test_type": load_test.test_type.value,
            "duration_seconds": load_test.duration_seconds,
            "total_clients": load_test.total_clients,
            "error_threshold_percent": load_test.error_threshold_percent,
            "can_abort": can_abort,
        },
        "overview": overview,
        "aggregates": aggregates,
        "timeseries": timeseries,
        "by_url": by_url,
        "distribution": distribution,
    }


def _iso(value: datetime | None) -> str | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.isoformat() + "Z"
    return value.isoformat().replace("+00:00", "Z")


@dataclass
class NdjsonMetrics:
    test_start_ms: int | None = None
    durations: list[float] = field(default_factory=list)
    duration_by_url: dict[str, list[float]] = field(default_factory=lambda: defaultdict(list))
    status_by_url: dict[str, list[str]] = field(default_factory=lambda: defaultdict(list))
    redirects_valid: int = 0
    redirects_invalid: int = 0
    buckets: dict[int, "_TimeBucket"] = field(default_factory=dict)
    vus_by_offset: dict[int, int] = field(default_factory=dict)
    counter_last: dict[str, float] = field(default_factory=dict)
    counter_by_bucket: dict[int, dict[str, float]] = field(default_factory=dict)


@dataclass
class _TimeBucket:
    durations: list[float] = field(default_factory=list)
    requests: int = 0
    errors: int = 0
    max_vus: int = 0
    bytes_sent: int = 0
    bytes_received: int = 0
    counter_start: dict[str, float] = field(default_factory=dict)
    counter_end: dict[str, float] = field(default_factory=dict)


def parse_ndjson_metrics(path: Path) -> NdjsonMetrics:
    metrics = NdjsonMetrics()
    with path.open(encoding="utf-8") as handle:
        for line in handle:
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
            except json.JSONDecodeError:
                continue
            if record.get("type") != "Point":
                continue
            _ingest_point(metrics, record)
    return metrics


def _ingest_point(metrics: NdjsonMetrics, record: dict[str, Any]) -> None:
    metric_name = record.get("metric")
    data = record.get("data") or {}
    value = data.get("value")
    if value is None:
        return

    time_ms = _parse_time_ms(data.get("time"))
    if time_ms is None:
        return

    if metrics.test_start_ms is None or time_ms < metrics.test_start_ms:
        metrics.test_start_ms = time_ms

    tags = data.get("tags") or {}
    offset = 0
    if metrics.test_start_ms is not None:
        offset = int((time_ms - metrics.test_start_ms) / 1000)

    bucket = metrics.buckets.setdefault(offset, _TimeBucket())

    if metric_name == "vus":
        vus = int(float(value))
        bucket.max_vus = max(bucket.max_vus, vus)
        metrics.vus_by_offset[offset] = max(metrics.vus_by_offset.get(offset, 0), vus)
        return

    if metric_name == "http_req_duration":
        duration = float(value)
        metrics.durations.append(duration)
        bucket.durations.append(duration)
        bucket.requests += 1
        url = tags.get("url") or tags.get("name") or ""
        if url:
            metrics.duration_by_url[url].append(duration)
        status = tags.get("status")
        if status and url:
            metrics.status_by_url[url].append(status)
        expected = tags.get("expected_response")
        if expected == "false":
            bucket.errors += 1
        return

    if metric_name == "http_reqs":
        bucket.requests += 1
        return

    if metric_name == "http_req_failed" and float(value) > 0:
        bucket.errors += 1
        return

    if metric_name == "status_counts":
        url = tags.get("url") or tags.get("name") or ""
        status = tags.get("status", "")
        if url:
            metrics.status_by_url[url].append(status)
        if tags.get("redirected") == "true":
            if tags.get("expected_response") == "true":
                metrics.redirects_valid += 1
            else:
                metrics.redirects_invalid += 1
        return

    if metric_name in ("data_sent", "data_received"):
        cumulative = float(value)
        metrics.counter_last[metric_name] = cumulative
        bucket.counter_end[metric_name] = cumulative
        if metric_name not in bucket.counter_start:
            bucket.counter_start[metric_name] = cumulative
        prev_bucket = metrics.counter_by_bucket.get(offset - 1, {})
        if metric_name not in bucket.counter_start and metric_name in prev_bucket:
            bucket.counter_start[metric_name] = prev_bucket[metric_name]
        metrics.counter_by_bucket[offset] = dict(metrics.counter_last)


def _parse_time_ms(time_value: Any) -> int | None:
    if time_value is None:
        return None
    if isinstance(time_value, (int, float)):
        ts = float(time_value)
        if ts > 1e15:
            return int(ts / 1_000_000)
        if ts > 1e12:
            return int(ts)
        return int(ts * 1000)
    if isinstance(time_value, str):
        try:
            normalized = time_value.replace("Z", "+00:00")
            dt = datetime.fromisoformat(normalized)
            return int(dt.timestamp() * 1000)
        except ValueError:
            return None
    return None


def _build_aggregates(
    summary: dict[str, Any] | None,
    metrics: dict[str, Any],
    ndjson: NdjsonMetrics,
) -> dict[str, Any]:
    response_times = _response_times_from_summary(summary)
    response_counts = _response_counts(summary, metrics, ndjson)
    bandwidth = _bandwidth_from_summary(summary)
    redirects = _redirects(summary, metrics, ndjson)
    return {
        "response_times": response_times,
        "response_counts": response_counts,
        "bandwidth": bandwidth,
        "redirects": redirects,
    }


def _response_times_from_summary(summary: dict[str, Any] | None) -> dict[str, float | None]:
    if not summary:
        return {
            "avg_ms": None,
            "min_ms": None,
            "max_ms": None,
            "med_ms": None,
            "p90_ms": None,
            "p95_ms": None,
        }
    duration = (summary.get("metrics") or {}).get("http_req_duration") or {}
    values = _metric_values(duration)

    def _round_val(key: str) -> float | None:
        raw = values.get(key)
        if raw is None:
            return None
        return round(float(raw), 2)

    return {
        "avg_ms": _round_val("avg"),
        "min_ms": _round_val("min"),
        "max_ms": _round_val("max"),
        "med_ms": _round_val("med"),
        "p90_ms": _round_val("p(90)"),
        "p95_ms": _round_val("p(95)"),
    }


def _classify_status(status: str) -> str:
    if not status or status == "0":
        return "timeout"
    try:
        code = int(status)
    except ValueError:
        return "network"
    if 200 <= code < 400:
        return "success"
    if 400 <= code < 500:
        return "error_4xx"
    if code >= 500:
        return "error_5xx"
    return "network"


def _response_counts(
    summary: dict[str, Any] | None,
    metrics: dict[str, Any],
    ndjson: NdjsonMetrics,
) -> dict[str, int]:
    counts = {
        "total": 0,
        "success": 0,
        "timeout": 0,
        "error_4xx": 0,
        "error_5xx": 0,
        "network_errors": 0,
    }

    all_statuses: list[str] = []
    for statuses in ndjson.status_by_url.values():
        all_statuses.extend(statuses)

    if all_statuses:
        counts["total"] = len(all_statuses)
        for status in all_statuses:
            kind = _classify_status(status)
            if kind == "success":
                counts["success"] += 1
            elif kind == "timeout":
                counts["timeout"] += 1
            elif kind == "error_4xx":
                counts["error_4xx"] += 1
            elif kind == "error_5xx":
                counts["error_5xx"] += 1
            else:
                counts["network_errors"] += 1
        return counts

    total = int(metrics.get("total_requests", 0))
    failed_rate = float(metrics.get("error_rate_percent", 0)) / 100.0
    failed = int(round(total * failed_rate))
    counts["total"] = total
    counts["success"] = max(0, total - failed)
    if summary:
        failed_metric = (summary.get("metrics") or {}).get("http_req_failed") or {}
        fails = int(_metric_values(failed_metric).get("fails") or 0)
        counts["network_errors"] = max(0, fails - failed)
    return counts


def _bandwidth_from_summary(summary: dict[str, Any] | None) -> dict[str, int]:
    if not summary:
        return {"bytes_sent": 0, "bytes_received": 0}
    root = summary.get("metrics") or {}
    sent = root.get("data_sent") or {}
    received = root.get("data_received") or {}
    sent_values = _metric_values(sent)
    recv_values = _metric_values(received)
    bytes_sent = int(sent_values.get("count") or sent_values.get("value") or 0)
    bytes_received = int(recv_values.get("count") or recv_values.get("value") or 0)
    return {"bytes_sent": bytes_sent, "bytes_received": bytes_received}


def _redirects(
    summary: dict[str, Any] | None,
    metrics: dict[str, Any],
    ndjson: NdjsonMetrics,
) -> dict[str, int]:
    if ndjson.redirects_valid or ndjson.redirects_invalid:
        return {
            "valid": ndjson.redirects_valid,
            "invalid": ndjson.redirects_invalid,
        }
    success = int(metrics.get("total_requests", 0))
    if summary:
        counts = _response_counts(summary, metrics, ndjson)
        success = counts.get("success", success)
    return {"valid": success, "invalid": 0}


def _build_timeseries(
    ndjson: NdjsonMetrics,
    *,
    bucket_seconds: int,
    duration_seconds: int,
) -> list[dict[str, Any]]:
    if not ndjson.buckets:
        return []

    max_offset = max(ndjson.buckets)
    cap = max(duration_seconds, max_offset + 1)
    series: list[dict[str, Any]] = []
    prev_sent = 0.0
    prev_recv = 0.0

    for offset in range(0, cap + 1):
        bucket = ndjson.buckets.get(offset)
        if not bucket:
            continue
        avg_ms = None
        if bucket.durations:
            avg_ms = round(sum(bucket.durations) / len(bucket.durations), 2)

        sent_end = bucket.counter_end.get("data_sent", prev_sent)
        recv_end = bucket.counter_end.get("data_received", prev_recv)
        sent_start = bucket.counter_start.get("data_sent", prev_sent)
        recv_start = bucket.counter_start.get("data_received", prev_recv)
        bytes_sent = max(0, int(sent_end - sent_start))
        bytes_received = max(0, int(recv_end - recv_start))
        prev_sent = sent_end
        prev_recv = recv_end

        series.append(
            {
                "offset_sec": offset,
                "active_clients": bucket.max_vus or ndjson.vus_by_offset.get(offset, 0),
                "avg_response_ms": avg_ms,
                "requests": bucket.requests,
                "bytes_sent": bytes_sent,
                "bytes_received": bytes_received,
                "error_count": bucket.errors,
            }
        )
    return series


def _build_by_url(
    load_test: LoadTest,
    ndjson: NdjsonMetrics,
    summary: dict[str, Any] | None,
) -> list[dict[str, Any]]:
    steps = load_test.urls if isinstance(load_test.urls, list) else []
    rows: list[dict[str, Any]] = []

    for step in steps:
        if not isinstance(step, dict):
            continue
        url = step.get("url", "")
        method = (step.get("request_type") or "GET").upper()
        durations = ndjson.duration_by_url.get(url, [])
        statuses = ndjson.status_by_url.get(url, [])
        requests = len(statuses) if statuses else len(durations)
        if requests == 0 and summary:
            requests = int(
                extract_metrics(summary).get("total_requests", 0)
            ) // max(len(steps), 1)

        success = sum(1 for s in statuses if _classify_status(s) == "success")
        if not statuses and durations:
            success = requests

        error_rate = 0.0
        if requests > 0:
            error_rate = round((requests - success) / requests * 100, 2)

        avg_ms = min_ms = max_ms = None
        if durations:
            avg_ms = round(sum(durations) / len(durations), 2)
            min_ms = round(min(durations), 2)
            max_ms = round(max(durations), 2)

        rows.append(
            {
                "url": url,
                "method": method,
                "label": f"{method} {url}",
                "requests": requests,
                "success": success,
                "avg_ms": avg_ms,
                "min_ms": min_ms,
                "max_ms": max_ms,
                "error_rate_percent": error_rate,
            }
        )
    return rows


def _build_distribution(
    ndjson: NdjsonMetrics,
    *,
    bucket_ms: int,
    max_buckets: int,
) -> list[dict[str, int]]:
    values = ndjson.durations
    if not values:
        return []

    min_ms = min(values)
    max_ms = max(values)
    start = int(min_ms // bucket_ms) * bucket_ms
    end_cap = start + bucket_ms * max_buckets
    histogram: dict[int, int] = defaultdict(int)

    for value in values:
        bucket_start = int(value // bucket_ms) * bucket_ms
        if bucket_start > end_cap:
            bucket_start = end_cap
        histogram[bucket_start] += 1

    return [
        {
            "bucket_start_ms": bucket_start,
            "bucket_end_ms": bucket_start + bucket_ms,
            "count": count,
        }
        for bucket_start, count in sorted(histogram.items())
    ]
