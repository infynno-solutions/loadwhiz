from celery import Celery

from src.core.config import settings

app = Celery(
    "loadwhiz_be",
    broker=settings.celery_broker_url,
    backend=settings.celery_broker_url,
    include=[
        "src.workers.tasks.host_verification",
        "src.workers.tasks.load_test_run",
    ],
)

app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    beat_schedule={
        "sweep-pending-hosts": {
            "task": "src.workers.tasks.host_verification.sweep_pending_hosts",
            "schedule": settings.host_verification_sweep_interval_minutes * 60,
        },
        "dispatch-scheduled-load-tests": {
            "task": "src.workers.tasks.load_test_run.dispatch_scheduled_load_tests",
            "schedule": settings.load_test_scheduled_dispatch_interval_minutes * 60,
        },
    },
)
