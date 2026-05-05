---
name: dev-environment
description: How to start the development environment — database, dependencies, and Prisma client. Use when running tests, building the app, verifying code, or performing any task that requires the application to compile or run.
---

# Development Environment Setup

Standard procedure to bring the local environment to a ready state. Run these steps before building, testing, or running the application.

---

## Quick Start (all steps)

```bash
# 1. Start PostgreSQL (via Docker Compose)
docker compose up -d --wait

# 2. Install Node.js dependencies
npm install

# 3. Set up environment variables (first time only)
[ ! -f .env ] && cp .env.example .env

# 4. Generate Prisma client (required after schema changes)
npx prisma generate

# 5. Apply database migrations
npx prisma migrate deploy
```

## When to Run Each Step

| Step | When needed |
|------|-------------|
| `docker compose up -d --wait` | Always — PostgreSQL must be running for Prisma |
| `npm install` | After pulling changes or when `node_modules` is missing |
| `cp .env.example .env` | First time only (`.env` is gitignored) |
| `npx prisma generate` | After any change to `prisma/schema.prisma` |
| `npx prisma migrate deploy` | After new migrations are added |

## Verifying the Environment

After setup, confirm everything is ready:

```bash
# Database is accepting connections
docker compose exec postgres pg_isready -U postgres

# Prisma client is generated (import resolves)
npx tsc --noEmit 2>&1 | head -5

# If both pass, the environment is ready for builds and tests
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Can't reach database server` | Run `docker compose up -d --wait` |
| `prisma generate` fails | Check `DATABASE_URL` in `.env` matches docker-compose |
| Port 5432 in use | Stop other PostgreSQL instances or change the port in `docker-compose.yml` |
| `node_modules` missing | Run `npm install` |

## Database Credentials (Local Dev Only)

- Host: `localhost`
- Port: `5432`
- User: `postgres`
- Password: `postgres`
- Database: `aml_case_mgmt`
- URL: `postgresql://postgres:postgres@localhost:5432/aml_case_mgmt`
