import json
import uuid
from datetime import UTC, datetime
from pathlib import Path

from src.core.k6_dashboard_builder import (
    build_dashboard_payload,
    format_load_description,
    parse_ndjson_metrics,
)
from src.models.load_test import (
    LoadTest,
    LoadTestResult,
    LoadTestResultStatus,
    LoadTestStatus,
    LoadTestType,
    LoadTestUrlSource,
)

FIXTURES = Path(__file__).parent / "fixtures"


def _make_load_test(**overrides) -> LoadTest:
    defaults = {
        "id": uuid.uuid4(),
        "organization_id": uuid.uuid4(),
        "host_id": uuid.uuid4(),
        "created_by_user_id": uuid.uuid4(),
        "name": "LoadWhiz Healthcheck",
        "url_source": LoadTestUrlSource.manual,
        "test_type": LoadTestType.per_test,
        "duration_seconds": 60,
        "initial_clients": 0,
        "total_clients": 100,
        "timeout_ms": 5000,
        "error_threshold_percent": 50,
        "status": LoadTestStatus.complete,
        "urls": [
            {
                "url": "https://example.com/health",
                "request_type": "GET",
            }
        ],
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    }
    defaults.update(overrides)
    return LoadTest(**defaults)


def _make_result(load_test: LoadTest, **overrides) -> LoadTestResult:
    defaults = {
        "id": uuid.uuid4(),
        "load_test_id": load_test.id,
        "status": LoadTestResultStatus.ready,
        "passed": True,
        "started_at": datetime(2026, 5, 25, 17, 22, 0, tzinfo=UTC),
        "finished_at": datetime(2026, 5, 25, 17, 23, 0, tzinfo=UTC),
        "created_at": datetime.now(UTC),
    }
    defaults.update(overrides)
    return LoadTestResult(**defaults)


def test_format_load_description():
    load_test = _make_load_test(duration_seconds=60, total_clients=100)
    assert format_load_description(load_test) == "100 clients over 1 min"
    load_test.duration_seconds = 45
    assert format_load_description(load_test) == "100 clients over 45 sec"


def test_parse_ndjson_metrics_fixture():
    ndjson = parse_ndjson_metrics(FIXTURES / "k6_metrics_sample.ndjson")
    assert len(ndjson.durations) == 3
    assert ndjson.buckets
    assert "https://example.com/health" in ndjson.duration_by_url


def test_build_dashboard_payload_shape():
    summary = json.loads((FIXTURES / "k6_summary_sample.json").read_text())
    load_test = _make_load_test()
    result = _make_result(load_test)
    payload = build_dashboard_payload(
        load_test,
        result,
        summary,
        ndjson_path=FIXTURES / "k6_metrics_sample.ndjson",
        bucket_seconds=1,
        distribution_bucket_ms=100,
        distribution_max_buckets=20,
    )

    assert payload["version"] == 1
    assert payload["meta"]["test_name"] == "LoadWhiz Healthcheck"
    assert payload["meta"]["load_description"] == "100 clients over 1 min"
    assert payload["overview"]["total_requests"] == 4
    assert payload["aggregates"]["response_times"]["avg_ms"] == 557.5
    assert payload["aggregates"]["bandwidth"]["bytes_sent"] == 22405
    assert payload["aggregates"]["response_counts"]["total"] == 3
    assert payload["aggregates"]["response_counts"]["error_5xx"] == 1
    assert payload["by_url"][0]["url"] == "https://example.com/health"
    assert payload["by_url"][0]["requests"] == 3
    assert payload["distribution"]
    assert any(p["offset_sec"] == 0 for p in payload["timeseries"])
