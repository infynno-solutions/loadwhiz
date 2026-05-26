# LoadWhiz

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![CI](https://github.com/infynno-solutions/loadwhiz/actions/workflows/ci.yml/badge.svg)](https://github.com/infynno-solutions/loadwhiz/actions/workflows/ci.yml)

**LoadWhiz** is an open source platform for configuring, scheduling, and running HTTP load tests with verified target hosts, multi-tenant organizations, and real-time results.

Originally built at [Infynno Solutions](https://infynno.com) by **Krunal Shah**, LoadWhiz combines a modern web UI with a FastAPI backend, Celery workers, and [Grafana k6](https://k6.io/) for test execution.

## Features

- **Organizations & teams** — Multi-tenant workspaces with owner, admin, and member roles; invitations and onboarding
- **Host verification** — DNS and HTTP checks before targets can be used in tests
- **Load tests** — Define URLs, VUs, duration, and schedules; run via k6 in Docker
- **Results & metrics** — Poll run status and view timeseries from completed tests
- **Account settings** — Profile, appearance (light/dark/system), password change, org management
- **API-first** — OpenAPI-documented REST API with typed client generation for the web app

## Tech stack

| Layer | Technologies |
|-------|----------------|
| Frontend | React 19, TanStack Start/Router/Query/Form, Tailwind CSS 4, shadcn/ui |
| Backend | FastAPI, SQLAlchemy, Alembic, PostgreSQL, Redis |
| Workers | Celery (host verification sweeps, scheduled tests, k6 orchestration) |
| Monorepo | Turborepo, Bun, Biome, Poetry (Python) |

## Prerequisites

- [Bun](https://bun.sh/) 1.3+ (`packageManager` in root `package.json`)
- **Full stack:** Python 3.13+, [Poetry](https://python-poetry.org/), Docker
- **Optional:** [k6](https://k6.io/) image pulled via Docker (`grafana/k6`) for load test runs

## Quick start

### 1. Clone and install

```bash
git clone https://github.com/infynno-solutions/loadwhiz.git
cd loadwhiz
bun install
```

### 2. Configure the API

```bash
cd apps/api
cp .env.example .env
```

Edit `.env` — at minimum set `JWT_SECRET`. For email (signup verification, invites), configure `RESEND_API_KEY` and `MAIL_FROM`.

```bash
POETRY_KEYRING_ENABLED=false poetry install
bun run docker:up      # PostgreSQL + Redis
bun run db:migrate
cd ../..
```

### 3. Configure the web app

```bash
cp apps/web/.env.example apps/web/.env
```

Default `VITE_API_URL=http://localhost:8000` works with the dev proxy.

### 4. Run the stack

**Terminal 1** — web + API:

```bash
bun run dev:stack
```

- Web: http://localhost:3000  
- API docs: http://localhost:8000/reference  

**Terminal 2** — Celery (required for host verification and load tests):

```bash
bun run --filter=api celery:dev
```

Register a user, complete organization onboarding, verify a host, then create and run a load test.

### Web only (UI development without API)

```bash
bun run dev:web
```

You need a running API (local or remote) and a valid `VITE_API_URL` for authenticated flows.

## Available scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start all apps (web, api, fumadocs) |
| `bun run dev:stack` | Web + API only |
| `bun run dev:web` | Frontend only |
| `bun run dev:api` | FastAPI only |
| `bun run build` | Production build (all packages) |
| `bun run check` | Biome lint + format |
| `bun run check-types` | TypeScript across the monorepo |

API-specific scripts (migrations, Celery, OpenAPI export): see [apps/api/README.md](./apps/api/README.md).

## Project structure

```
loadwhiz/
├── apps/
│   ├── api/          # FastAPI, Celery, Alembic, Docker Compose
│   ├── web/          # TanStack Start frontend
│   └── fumadocs/     # Documentation site
├── packages/
│   ├── ui/           # Shared shadcn/ui components
│   ├── env/          # Shared environment helpers
│   └── config/       # Shared TS/Biome config
├── api.json          # OpenAPI spec (sync from running API)
├── LICENSE           # MIT
└── CONTRIBUTING.md   # Contribution guide
```

## UI customization

Shared components live in `packages/ui`:

```bash
npx shadcn@latest add accordion dialog table -c packages/ui
```

```tsx
import { Button } from "@loadwhiz/ui/components/button";
```

Design tokens: `packages/ui/src/styles/globals.css`.

## OpenAPI client

After API changes:

```bash
# API running on :8000
cd apps/api && bun run openapi:pull
cd ../web && bun run openapi-ts
```

## Verify changes

```bash
bun run check
bun run build --filter=web
```

## Contributing

We welcome issues and pull requests. Please read:

- [CONTRIBUTING.md](./CONTRIBUTING.md) — setup, style, PR process  
- [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)  
- [SECURITY.md](./SECURITY.md) — responsible disclosure  

## License

This project is licensed under the [MIT License](./LICENSE).

Copyright (c) 2026 [Infynno Solutions](https://infynno.com).

## Authors

- **Krunal Shah** — original author ([krunal@infynno.com](mailto:krunal@infynno.com))
- **Infynno Solutions** — open source maintainer

## Acknowledgments

LoadWhiz was scaffolded with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack) and uses [shadcn/ui](https://ui.shadcn.com/), [TanStack](https://tanstack.com/), and [Grafana k6](https://k6.io/).
