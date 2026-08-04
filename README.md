# Task Manager API — CI/CD Pipeline Demo

A small Express + PostgreSQL REST API built as a hands-on exercise in designing and debugging a real CI/CD pipeline with GitHub Actions — from linting and automated testing through to Docker image builds and publishing.

The application itself (a task manager) is intentionally simple. The focus of this project is the **pipeline and engineering workflow** around it: branching strategy, automated testing against a real database, and gated deployment stages.

## Tech Stack

- **Runtime:** Node.js (tested against 20.x and 22.x)
- **Framework:** Express
- **Database:** PostgreSQL, accessed via the `pg` driver directly (no ORM)
- **Testing:** Jest + Supertest
- **Linting:** ESLint (flat config)
- **CI/CD:** GitHub Actions
- **Containerization:** Docker, image published to Docker Hub

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/task/tasks` | List all tasks |
| `GET` | `/api/task/search?completed=true` | Filter tasks by completion status |
| `GET` | `/api/task/:id` | Get a single task by ID |
| `POST` | `/api/task/add` | Create a new task |
| `PUT` | `/api/task/:id` | Update an existing task |
| `DELETE` | `/api/task/:id` | Delete a task |

## Branching & Pipeline Strategy

This repo uses a two-tier branching model, each with its own pipeline scoped to its purpose:

```
feature/*  →  PR into develop  →  develop  →  PR into main  →  main
```

**`develop` — fast feedback, every push/PR**
- Lint
- Single Node version
- Tests run against a real, disposable Postgres instance (via a GitHub Actions service container)
- No Docker build — kept intentionally lightweight for quick iteration

**`main` — full validation, pre-deployment**
- Lint
- Tests run across a Node version matrix (20.x, 22.x)
- Tests run against Postgres, same as `develop`
- On successful merge (`push` event only — not on PR), a Docker image is built and pushed to Docker Hub

The Docker build/publish step is explicitly gated behind test success (`needs: test`) and restricted to direct pushes on `main` (`if: github.event_name == 'push'`), so an image is never published from unverified or in-review code.

## Running Locally

**Prerequisites:** Node.js 20+, Docker (for Postgres)

```bash
# Start a local Postgres instance
docker run --name task-postgres \
  -e POSTGRES_USER=<user> \
  -e POSTGRES_PASSWORD=<password> \
  -e POSTGRES_DB=<dbname> \
  -p 5432:5432 \
  -d postgres:16

# Install dependencies
npm install

# Copy and configure environment variables
cp .env.example .env

# Run the app
npm start

# Run the test suite
npm test

# Run the linter
npm run lint
```

## Running with Docker

```bash
docker pull <dockerhub-username>/ci-cd-demo:latest
docker run -p 3000:3000 <dockerhub-username>/ci-cd-demo:latest
```

## What This Project Demonstrates

- Designing a CI pipeline with matrix testing across multiple runtime versions
- Running integration tests against a real database inside CI, using service containers with health checks — not mocks
- Environment-variable-driven configuration that correctly separates test, development, and production credentials
- Gating deployment steps on upstream job success and specific trigger conditions
- A branching model that mirrors real team workflows (feature branches → integration branch → protected main branch)
- Debugging real pipeline failures: YAML structure errors, credential mismatches between CI service containers and application config, and environment-driven logic bugs

## Notes

- No schema migration tool is in use yet — the database schema is applied via a manual init script.
- Task IDs are currently client-supplied rather than server-generated, a deliberate simplification for this learning project.
