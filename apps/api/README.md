# LoadWhiz API (`apps/api`)

FastAPI backend with PostgreSQL, Redis, and Celery for host verification and k6 load test execution.

## Prerequisites

- Python 3.13+
- [Poetry](https://python-poetry.org/)
- [Bun](https://bun.sh/) (monorepo scripts)
- Docker (Postgres and Redis)

## Setup

From this directory (`apps/api`):

```bash
cp .env.example .env
# Edit .env (JWT_SECRET, RESEND_API_KEY, etc.)

POETRY_KEYRING_ENABLED=false poetry install
bun run docker:up
bun run db:migrate
```

Or from the monorepo root:

```bash
cd apps/api && cp .env.example .env && POETRY_KEYRING_ENABLED=false poetry install
bun run --filter=api docker:up
bun run --filter=api db:migrate
```

## Run API

From monorepo root:

```bash
bun run dev:api
```

From `apps/api`:

```bash
bun run dev
# or: poetry run fastapi dev src/main.py --host 0.0.0.0 --port 8000
```

- Health: http://localhost:8000/
- API docs: http://localhost:8000/reference

## Full stack (web + API)

From monorepo root (with Docker services up in `apps/api`):

```bash
bun run dev:stack
```

Web runs on http://localhost:3000 and proxies API requests to port 8000.

Run Celery in a **second terminal** (not part of `turbo dev`):

```bash
bun run --filter=api celery:dev
```

## Celery scripts

| Script | Purpose |
|--------|---------|
| `bun run celery:worker` | Worker only |
| `bun run celery:beat` | Beat scheduler only |
| `bun run celery:dev` | Worker + beat (local shortcut) |

Redis must be running (`bun run docker:up`).

## Load test execution (k6)

Load tests run in ephemeral **Grafana k6** containers. The Celery worker needs access to the Docker socket.

```bash
bun run docker:up
docker pull grafana/k6:0.57.0
bun run db:migrate
```

**Local Celery** (not in Compose): if you see `network loadwhiz-network not found`, either run `docker network create loadwhiz-network` or set `K6_DOCKER_NETWORK=` (empty) in `.env`.

**API flow**

1. Create a load test (`draft`) with URLs and a verified host.
2. `POST /api/v1/organizations/{org_id}/tests/{test_id}/run` — starts k6 (or schedules via `scheduled_at`).
3. `GET .../tests/{test_id}/results` — poll run metrics.
4. `POST .../tests/{test_id}/stop` — cancel a pending/running test.

**Docker Compose** can run `api`, `celery-worker` (with `/var/run/docker.sock`), and `celery-beat`.

Set `DATABASE_URL` in `.env` to `postgresql+asyncpg://postgres:postgres@postgres:5432/loadwhiz` when using the full Compose stack (not just Postgres/Redis).

## OpenAPI

Export the live schema to the monorepo root (API must be running on port 8000):

```bash
bun run openapi:pull
```

Updates [`../../api.json`](../../api.json) for the web app's OpenAPI client generation.

## Tests

```bash
bun run test
# or: poetry run pytest
```
