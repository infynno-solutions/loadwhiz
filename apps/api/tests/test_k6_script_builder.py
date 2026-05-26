import uuid
from datetime import UTC, datetime

import pytest

from src.core.k6_script_builder import build_k6_script
from src.core.k6_metrics import evaluate_passed, extract_metrics
from src.core.load_test_run_validation import validate_runnable_urls
from src.models.load_test import LoadTest, LoadTestStatus, LoadTestType, LoadTestUrlSource


def _make_load_test(**overrides) -> LoadTest:
    defaults = {
        "id": uuid.uuid4(),
        "organization_id": uuid.uuid4(),
        "host_id": uuid.uuid4(),
        "created_by_user_id": uuid.uuid4(),
        "url_source": LoadTestUrlSource.manual,
        "test_type": LoadTestType.per_test,
        "duration_seconds": 60,
        "initial_clients": 0,
        "total_clients": 50,
        "timeout_ms": 5000,
        "error_threshold_percent": 50,
        "status": LoadTestStatus.draft,
        "urls": [
            {
                "url": "https://example.com/health",
                "request_type": "GET",
                "bearer": {"token": "secret", "prefix": "Bearer"},
            }
        ],
        "created_at": datetime.now(UTC),
        "updated_at": datetime.now(UTC),
    }
    defaults.update(overrides)
    return LoadTest(**defaults)


def test_build_script_per_test_executor():
    script = build_k6_script(_make_load_test(test_type=LoadTestType.per_test))
    assert "per-vu-iterations" in script
    assert "loopSequence = false" in script
    assert "group(step.url" in script
    assert "statusCounts" in script


def test_build_script_maintain_load_loops():
    script = build_k6_script(
        _make_load_test(
            test_type=LoadTestType.maintain_load,
            initial_clients=10,
        )
    )
    assert "loopSequence = true" in script
    assert "ramping-vus" in script


def test_build_script_per_second_ramping():
    script = build_k6_script(
        _make_load_test(
            test_type=LoadTestType.per_second,
            total_clients=30,
            duration_seconds=90,
        )
    )
    assert "ramping-vus" in script
    assert '"duration": "30s"' in script


def test_validate_runnable_urls_rejects_auth_hint():
    with pytest.raises(ValueError, match="requires authentication"):
        validate_runnable_urls(
            [{"url": "https://example.com/x", "auth_hint": "Bearer"}]
        )


def test_extract_metrics_and_passed():
    summary = {
        "metrics": {
            "http_reqs": {"values": {"count": 100, "rate": 10.0}},
            "http_req_failed": {"values": {"rate": 0.1}},
            "http_req_duration": {"values": {"p(95)": 120.5, "avg": 80.0}},
        },
        "state": {"testRunDurationMs": 10000},
    }
    metrics = extract_metrics(summary)
    assert metrics["total_requests"] == 100
    assert metrics["error_rate_percent"] == 10.0
    assert metrics["rps"] == 10.0
    assert evaluate_passed(metrics, 50) is True
    assert evaluate_passed(metrics, 5) is False
    assert evaluate_passed(metrics, 50, has_summary=False) is False
    assert evaluate_passed({"total_requests": 0, "error_rate_percent": 0}, 50) is False
