# [Project Name] — AML/STR Case Management Platform

> Anti-Money Laundering case management and Suspicious Transaction Reporting platform for Singapore banking AML/CFT compliance.

## Tech Stack

- **Frontend:** Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes, Prisma ORM, PostgreSQL
- **Testing:** Vitest (unit), Playwright (E2E)

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- npm 10+

### Setup

```bash
# Clone and install
git clone [repo-url]
cd aml-str-demo
npm install

# Environment
cp .env.example .env
# Edit .env with your PostgreSQL connection string

# Database
npx prisma migrate dev
npx prisma db seed

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Auth session secret |
| `NEXTAUTH_URL` | App URL (http://localhost:3000) |

## Project Structure

```
app/            ← Pages + API routes
components/     ← React components
services/       ← Business logic
lib/            ← Utilities + types
prisma/         ← Schema + migrations
data/           ← Seed data
tests/          ← E2E tests
docs/           ← Architecture, design, reviews
```

## Features

- [ ] AML Dashboard — case status overview
- [ ] Case List — filterable, sortable, paginated
- [ ] Case Detail — full investigation view
- [ ] STR Filing — multi-step filing workflow
- [ ] Audit Trail — compliance logging

## Testing

```bash
# Unit tests
npx vitest run

# E2E tests
npx playwright test

# Coverage
npx vitest run --coverage
```

## License

Proprietary — Internal use only.
