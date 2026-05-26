from __future__ import annotations

import json
import logging
import os
import shutil
from dataclasses import dataclass
from pathlib import Path
from uuid import UUID

import docker
from docker.errors import DockerException, NotFound

from src.core.config import settings
from src.core.k6_script_builder import build_k6_script
from src.models.load_test import LoadTest

logger = logging.getLogger(__name__)


@dataclass
class K6RunOutcome:
    exit_code: int
    container_id: str | None
    summary: dict | None
    error_message: str | None
    run_dir: Path | None = None


class K6Runner:
    def __init__(self) -> None:
        self._client = docker.from_env()

    def _resolve_docker_network(self) -> str | None:
        """Use configured network when it exists; otherwise default bridge."""
        name = (settings.k6_docker_network or "").strip()
        if not name:
            return None
        try:
            self._client.networks.get(name)
            return name
        except NotFound:
            logger.warning(
                "Docker network '%s' not found; k6 will use the default bridge network. "
                "Start compose (`docker compose up -d`) or run "
                "`docker network create %s` to attach k6 to that network.",
                name,
                name,
            )
            return None

    def prepare_run_dir(self, result_id: UUID) -> Path:
        run_dir = Path(settings.k6_runs_dir) / str(result_id)
        run_dir.mkdir(parents=True, exist_ok=True)
        # k6 runs as a non-root user; ensure the output volume is writable.
        os.chmod(run_dir, 0o777)
        return run_dir

    def write_script(self, run_dir: Path, load_test: LoadTest) -> Path:
        script_path = run_dir / "test.js"
        script_path.write_text(build_k6_script(load_test), encoding="utf-8")
        return script_path

    def start(self, load_test: LoadTest, result_id: UUID) -> tuple[str, Path]:
        run_dir = self.prepare_run_dir(result_id)
        self.write_script(run_dir, load_test)

        run_kwargs: dict = {
            "image": settings.k6_image,
            "command": [
                "run",
                "--summary-export=/output/summary.json",
                "--out",
                "json=/output/metrics.ndjson",
                "/scripts/test.js",
            ],
            "detach": True,
            "remove": False,
            "volumes": {
                str(run_dir.resolve()): {"bind": "/output", "mode": "rw"},
                str((run_dir / "test.js").resolve()): {
                    "bind": "/scripts/test.js",
                    "mode": "ro",
                },
            },
            "mem_limit": settings.k6_container_memory,
            "nano_cpus": int(settings.k6_container_cpus * 1_000_000_000),
        }
        network = self._resolve_docker_network()
        if network:
            run_kwargs["network"] = network

        container = self._client.containers.run(**run_kwargs)
        return container.id, run_dir

    def wait(self, container_id: str, run_dir: Path) -> K6RunOutcome:
        container_id = container_id
        try:
            container = self._client.containers.get(container_id)
            result = container.wait()
            exit_code = int(result.get("StatusCode", 1))
            summary = self._read_summary(run_dir)
            error_message = None
            if exit_code != 0 and summary is None:
                logs = container.logs(tail=50).decode("utf-8", errors="replace")
                error_message = f"k6 exited with code {exit_code}: {logs[-2000:]}"
            return K6RunOutcome(
                exit_code=exit_code,
                container_id=container_id,
                summary=summary,
                error_message=error_message,
                run_dir=run_dir,
            )
        except DockerException as exc:
            logger.exception("Docker k6 wait failed for container %s", container_id)
            return K6RunOutcome(
                exit_code=1,
                container_id=container_id,
                summary=None,
                error_message=str(exc),
                run_dir=run_dir,
            )
        finally:
            try:
                container = self._client.containers.get(container_id)
                container.remove(force=True)
            except NotFound:
                pass

    def run(self, load_test: LoadTest, result_id: UUID) -> K6RunOutcome:
        container_id, run_dir = self.start(load_test, result_id)
        return self.wait(container_id, run_dir)

    def stop(self, container_id: str) -> None:
        try:
            container = self._client.containers.get(container_id)
            container.stop(timeout=10)
            container.remove(force=True)
        except NotFound:
            pass

    def cleanup_run_dir(self, run_dir: Path) -> None:
        if run_dir.exists():
            shutil.rmtree(run_dir, ignore_errors=True)

    def _read_summary(self, run_dir: Path) -> dict | None:
        summary_path = run_dir / "summary.json"
        if not summary_path.exists():
            return None
        try:
            return json.loads(summary_path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return None
