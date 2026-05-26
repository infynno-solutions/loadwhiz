# Contributing to LoadWhiz

Thank you for your interest in contributing to LoadWhiz. This document explains how to get set up, propose changes, and what we expect from contributions.

LoadWhiz is open source software maintained by [Infynno Solutions](https://infynno.com), originally developed by **Krunal Shah**.

## Code of Conduct

By participating, you agree to uphold our [Code of Conduct](./CODE_OF_CONDUCT.md).

## Ways to Contribute

- Report bugs or request features via [GitHub Issues](https://github.com/infynno-solutions/loadwhiz/issues)
- Improve documentation (README, API docs, comments)
- Fix bugs or implement features via pull requests
- Review pull requests and help others in discussions

## Development Setup

### Prerequisites

- [Bun](https://bun.sh/) 1.3+ (monorepo package manager)
- [Node.js](https://nodejs.org/) compatible with Bun (for tooling)
- For full stack work:
  - Python 3.13+
  - [Poetry](https://python-poetry.org/)
  - Docker (PostgreSQL, Redis; k6 for load tests)

### Clone and install

```bash
git clone https://github.com/infynno-solutions/loadwhiz.git
cd loadwhiz
bun install
```

### Web app only

```bash
cp apps/web/.env.example apps/web/.env
bun run dev:web
```

Open http://localhost:3000

### Full stack (recommended for most changes)

```bash
cd apps/api
cp .env.example .env
# Edit JWT_SECRET, RESEND_API_KEY, etc.

POETRY_KEYRING_ENABLED=false poetry install
bun run docker:up
bun run db:migrate
cd ../..

bun run dev:stack
```

In a **second terminal**, start Celery (host verification and load tests):

```bash
bun run --filter=api celery:dev
```

See [apps/api/README.md](./apps/api/README.md) for API-only commands, k6, and OpenAPI export.

## Project Layout

| Path | Description |
|------|-------------|
| `apps/web` | React + TanStack Start frontend |
| `apps/api` | FastAPI backend, Celery workers, Alembic migrations |
| `apps/fumadocs` | Documentation site |
| `packages/ui` | Shared shadcn/ui components |
| `api.json` | OpenAPI spec (sync from running API) |

## Making Changes

### Branching

- Create a feature branch from `main`: `git checkout -b feat/short-description`
- Keep commits focused; we prefer [Conventional Commits](https://www.conventionalcommits.org/) (e.g. `feat(web): add host filter`, `fix(api): validate invite role`)

### Code style

**TypeScript / JavaScript** (web, packages):

```bash
bun run check    # Biome format + lint (also runs on pre-commit via Lefthook)
bun run build --filter=web
bun run check-types
```

Install git hooks from the repo root (optional but recommended):

```bash
bunx lefthook install
```

### API contract changes

If you change FastAPI routes or schemas:

1. Run the API locally
2. From `apps/api`: `bun run openapi:pull` (updates root `api.json`)
3. From `apps/web`: `bun run openapi-ts` (regenerates the typed client)

Include both `api.json` and generated client changes in your PR when applicable.

### Database migrations

```bash
cd apps/api
bun run db:revision   # after model changes
bun run db:migrate
```

Commit new Alembic revision files under `apps/api/src/db/migrations/`.

## Pull Request Process

1. Update documentation if behavior or setup steps change
2. Ensure CI passes (or note why checks are skipped)
3. Fill out the PR template with a clear summary and test plan
4. Link related issues (`Fixes #123` when appropriate)
5. A maintainer will review; address feedback with additional commits or squash as requested

Include a brief manual test plan in the PR when behavior changes.

## Reporting Bugs

Use the [bug report template](https://github.com/infynno-solutions/loadwhiz/issues/new/choose) and include:

- LoadWhiz version or commit SHA
- Environment (OS, Bun/Python versions, Docker or not)
- Steps to reproduce and expected vs actual behavior
- Logs or screenshots when helpful (redact secrets)

## Feature Requests

Open a [feature request](https://github.com/infynno-solutions/loadwhiz/issues/new/choose) describing the problem, proposed solution, and alternatives you considered.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE) owned by Infynno Solutions.

## Questions

- Open a [GitHub Discussion](https://github.com/infynno-solutions/loadwhiz/discussions) for general questions
- For security issues, see [SECURITY.md](./SECURITY.md) — do not file public issues

Thank you for helping improve LoadWhiz.
