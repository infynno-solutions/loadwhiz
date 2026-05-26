import uuid


def enqueue_verify_host(host_id: uuid.UUID) -> None:
    from src.workers.tasks.host_verification import verify_host
    verify_host.delay(str(host_id))
