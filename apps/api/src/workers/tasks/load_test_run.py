from __future__ import annotations

import logging
import uuid
from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy import select

from src.core.host_validation import HostValidationError

from src.core.k6_dashboard_builder import (
    build_dashboard_payload,
    build_live_dashboard_skeleton,
    parse_ndjson_metrics,
)
from src.core.k6_live_metrics import extract_metrics_from_ndjson
from src.core.k6_metrics import evaluate_passed, extract_metrics
from src.services.result_events import publish_result_event
from src.core.load_test_run_validation import validate_runnable_urls
from src.core.load_test_validation import validate_host_verified, validate_urls_for_host
from src.models.host import Host, HostStatus
from src.models.load_test import (
    LoadTest,
    LoadTestResult,
    LoadTestResultStatus,
    LoadTestStatus,
)
from src.services.k6_runner import K6Runner
from src.services.load_test_callbacks import deliver_run_callbacks_sync
from src.workers.celery_app import app
from src.workers.db import get_sync_db

logger = logging.getLogger(__name__)

_TERMINAL_RESULT_STATUSES = {
    LoadTestResultStatus.ready,
    LoadTestResultStatus.failed,
    LoadTestResultStatus.cancelled,
}


@app.task(name="src.workers.tasks.load_test_run.run_load_test", bind=True, max_retries=0)
def run_load_test(self, test_id: str, result_id: str) -> dict:  # noqa: ANN001
    test_uuid = uuid.UUID(test_id)
    result_uuid = uuid.UUID(result_id)
    runner = K6Runner()

    with get_sync_db() as db:
        load_test = db.get(LoadTest, test_uuid)
        result = db.get(LoadTestResult, result_uuid)

        if not load_test or not result or result.load_test_id != test_uuid:
            return {"skipped": True, "reason": "not_found"}

        if result.status in _TERMINAL_RESULT_STATUSES:
            return {"skipped": True, "reason": "already_terminal"}

        host = db.get(Host, load_test.host_id)
        if not host or host.status != HostStatus.verified:
            _finalize_failed(
                db,
                load_test,
                result,
                error_message="Target host is not verified",
            )
            publish_result_event(
                str(result.id),
                "done",
                {"status": result.status.value, "passed": False},
            )
            return {"failed": True, "reason": "host_not_verified"}

        try:
            validate_host_verified(host)
            validate_urls_for_host(load_test.urls, host)
            validate_runnable_urls(load_test.urls)
        except (ValueError, HostValidationError) as exc:
            _finalize_failed(db, load_test, result, error_message=str(exc))
            return {"failed": True, "reason": str(exc)}

        now = datetime.now(UTC)
        load_test.status = LoadTestStatus.running
        result.status = LoadTestResultStatus.running
        result.started_at = result.started_at or now
        load_test.updated_at = now
        db.flush()

        container_id: str | None = None
        run_dir = None

        def on_progress(progress_dir: Path) -> None:
            _sync_run_progress(db, load_test, result, progress_dir)

        try:
            container_id, run_dir = runner.start(load_test, result_uuid)
            result.container_id = container_id
            result.dashboard = build_live_dashboard_skeleton(load_test, result)
            db.flush()
            publish_result_event(
                str(result.id),
                "dashboard",
                result.dashboard,
            )
            outcome = runner.wait(
                container_id,
                run_dir,
                on_progress=on_progress,
            )
        except Exception as exc:
            logger.exception("k6 run failed for test %s", test_id)
            if container_id and run_dir:
                runner.cleanup_run_dir(run_dir)
            _finalize_failed(db, load_test, result, error_message=str(exc))
            return {"failed": True, "reason": str(exc)}

        finished_at = datetime.now(UTC)
        result.finished_at = finished_at
        result.exit_code = outcome.exit_code
        result.container_id = outcome.container_id or container_id

        has_summary = outcome.summary is not None and bool(outcome.summary)

        if outcome.error_message and not has_summary:
            if outcome.run_dir:
                runner.cleanup_run_dir(outcome.run_dir)
            result.status = LoadTestResultStatus.failed
            result.error_message = outcome.error_message
            result.passed = False
            load_test.status = LoadTestStatus.complete
            load_test.active_result_id = None
            load_test.last_run_at = finished_at
            load_test.updated_at = finished_at
            db.flush()
            _notify(load_test, result)
            publish_result_event(
                str(result.id),
                "done",
                {
                    "status": result.status.value,
                    "passed": result.passed,
                    "error_message": result.error_message,
                },
            )
            return {"failed": True, "exit_code": outcome.exit_code}

        metrics = extract_metrics(outcome.summary or {})
        passed = evaluate_passed(
            metrics,
            load_test.error_threshold_percent,
            has_summary=has_summary,
        )

        result.summary = outcome.summary
        result.metrics = metrics
        result.passed = passed
        try:
            ndjson_path = None
            if outcome.run_dir:
                ndjson_path = Path(outcome.run_dir) / "metrics.ndjson"
            result.dashboard = build_dashboard_payload(
                load_test,
                result,
                outcome.summary,
                ndjson_path=ndjson_path,
                partial=False,
            )
        except Exception:
            logger.exception("Failed to build dashboard for result %s", result_id)
            result.dashboard = None
        finally:
            if outcome.run_dir:
                runner.cleanup_run_dir(outcome.run_dir)

        result.status = (
            LoadTestResultStatus.ready if passed else LoadTestResultStatus.failed
        )
        if not has_summary:
            result.error_message = (
                outcome.error_message
                or "k6 did not produce a summary file (check run directory permissions)"
            )
        elif metrics.get("total_requests", 0) <= 0:
            result.error_message = (
                outcome.error_message
                or "k6 completed but recorded no HTTP requests"
            )
        else:
            result.error_message = outcome.error_message
        load_test.status = LoadTestStatus.complete
        load_test.active_result_id = None
        load_test.last_run_at = finished_at
        load_test.updated_at = finished_at

        _notify(load_test, result)
        publish_result_event(
            str(result.id),
            "done",
            {
                "status": result.status.value,
                "passed": result.passed,
                "metrics": result.metrics,
            },
        )
        publish_result_event(str(result.id), "dashboard", result.dashboard)
        return {
            "passed": passed,
            "exit_code": outcome.exit_code,
            "metrics": metrics,
        }


@app.task(name="src.workers.tasks.load_test_run.stop_load_test", bind=True, max_retries=0)
def stop_load_test(self, test_id: str, result_id: str) -> dict:  # noqa: ANN001
    test_uuid = uuid.UUID(test_id)
    result_uuid = uuid.UUID(result_id)
    runner = K6Runner()

    with get_sync_db() as db:
        load_test = db.get(LoadTest, test_uuid)
        result = db.get(LoadTestResult, result_uuid)

        if not load_test or not result:
            return {"skipped": True}

        if result.container_id:
            try:
                runner.stop(result.container_id)
            except Exception:
                logger.exception("Failed to stop k6 container %s", result.container_id)

        now = datetime.now(UTC)
        result.status = LoadTestResultStatus.cancelled
        result.finished_at = now
        result.error_message = result.error_message or "Run cancelled by user"
        load_test.status = LoadTestStatus.complete
        load_test.active_result_id = None
        load_test.updated_at = now

        publish_result_event(
            str(result.id),
            "done",
            {
                "status": result.status.value,
                "passed": result.passed,
                "error_message": result.error_message,
            },
        )
        return {"cancelled": True}


@app.task(name="src.workers.tasks.load_test_run.dispatch_scheduled_load_tests")
def dispatch_scheduled_load_tests() -> dict:
    now = datetime.now(UTC)
    dispatched = 0

    with get_sync_db() as db:
        pending_tests = db.scalars(
            select(LoadTest).where(
                LoadTest.status == LoadTestStatus.pending,
                LoadTest.scheduled_at.isnot(None),
                LoadTest.scheduled_at <= now,
                LoadTest.active_result_id.isnot(None),
            )
        ).all()

        for load_test in pending_tests:
            if not load_test.active_result_id:
                continue
            run_load_test.delay(
                str(load_test.id),
                str(load_test.active_result_id),
            )
            dispatched += 1

    return {"dispatched": dispatched}


def _sync_run_progress(
    db,
    load_test: LoadTest,
    result: LoadTestResult,
    run_dir: Path,
) -> None:
    ndjson_path = run_dir / "metrics.ndjson"
    if not ndjson_path.exists():
        return
    try:
        ndjson = parse_ndjson_metrics(ndjson_path)
        result.metrics = extract_metrics_from_ndjson(
            ndjson,
            duration_seconds=load_test.duration_seconds,
        )
        result.dashboard = build_dashboard_payload(
            load_test,
            result,
            result.summary,
            ndjson_path=ndjson_path,
            partial=True,
        )
        db.flush()
        publish_result_event(str(result.id), "metrics", result.metrics)
        publish_result_event(str(result.id), "dashboard", result.dashboard)
        publish_result_event(
            str(result.id),
            "status",
            {"status": result.status.value, "passed": result.passed},
        )
    except Exception:
        logger.exception("Failed to sync run progress for result %s", result.id)


def _finalize_failed(
    db,
    load_test: LoadTest,
    result: LoadTestResult,
    *,
    error_message: str,
) -> None:
    now = datetime.now(UTC)
    result.status = LoadTestResultStatus.failed
    result.error_message = error_message
    result.passed = False
    result.finished_at = now
    load_test.status = LoadTestStatus.complete
    load_test.active_result_id = None
    load_test.last_run_at = now
    load_test.updated_at = now
    db.flush()
    _notify(load_test, result)
    publish_result_event(
        str(result.id),
        "done",
        {
            "status": result.status.value,
            "passed": result.passed,
            "error_message": result.error_message,
        },
    )


def _notify(load_test: LoadTest, result: LoadTestResult) -> None:
    if not load_test.callback_url and not load_test.callback_email:
        return
    try:
        deliver_run_callbacks_sync(
            test_id=load_test.id,
            result_id=result.id,
            test_name=load_test.name,
            callback_url=load_test.callback_url,
            callback_email=load_test.callback_email,
            passed=result.passed,
            metrics=result.metrics,
            finished_at=result.finished_at,
        )
    except Exception:
        logger.exception("Callback delivery failed for test %s", load_test.id)
