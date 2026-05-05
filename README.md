# AML / STR Case Management Platform

A compliance case management platform for Singapore-based banks to investigate AML alerts, assess risk, and file Suspicious Transaction Reports (STRs) with STRO via SONAR.

## Overview

This platform enables compliance officers — **AML Analysts**, **Compliance Reviewers**, and **Operations Managers** — to manage the full lifecycle of anti-money laundering investigations. Built for Singapore's AML/CFT regulatory framework (MAS Notice 626), it supports alert triage, customer due diligence, transaction analysis, STR decision workflows, and immutable audit logging.

## Features

- **Dashboard** — summary metrics (open cases, high-risk count, pending approvals), priority case queue sorted by risk score, and recent activity feed
- **Case list** — searchable, filterable, and sortable table of all AML cases with status badges and risk scores
- **Case detail** — customer profile, transaction timeline, risk indicators, investigation notes, and decision panel on a single page
- **Investigation notes** — append-only typed notes (Customer Profile Review, Transaction Review, Counterparty Review, Customer Outreach, Decision Rationale) with full audit trail
- **STR decision workflow** — analyst recommendation → reviewer approval/return → filing status tracking (Not Started → Drafting → Ready for Filing → Filed)
- **Role-based action visibility** — Analyst sees note and recommendation forms; Reviewer sees approval controls; Operations Manager has full read access
- **Immutable audit log** — every status change, note, decision, and filing action is recorded with actor, timestamp, and details

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + shadcn/ui primitives |
| Component Library | shadcn/ui |
| ORM | Prisma |
| Database | PostgreSQL 16 |
| Validation | Zod |
| Unit Tests | Vitest + Testing Library |
| Design System | CodeCademy dark theme |

## Getting Started

### Prerequisites

- Node.js 18+
- Docker (for PostgreSQL)
- npm

### Setup

```bash
# Clone the repo
git clone <repo-url>
cd test-roundtable-demo

# Start the database
docker-compose up -d

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations
npx prisma migrate dev

# Seed demo data
npx prisma db seed

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/aml_case_mgmt` |
| `NEXT_PUBLIC_APP_URL` | Application base URL | `http://localhost:3000` |

### Running Tests

```bash
npm test          # Unit tests (Vitest)
npm run build     # Type check + production build
```

## Project Structure

```
app/                          Next.js App Router
  page.tsx                    Dashboard (/)
  cases/
    page.tsx                  Case list (/cases)
    [id]/page.tsx             Case detail (/cases/[id])
  api/
    dashboard/summary/        GET — dashboard metrics
    cases/                    GET — case list
    cases/[id]/               GET — case detail
    cases/[id]/notes/         POST — add investigation note
    cases/[id]/decision/      POST/PATCH — STR recommendation
    cases/[id]/filing/        PATCH — filing status update
components/
  sidebar.tsx                 Navigation sidebar
  role-selector.tsx           Role switcher (Analyst/Reviewer/Ops Manager)
  case-detail/                Case detail panel components
  cases/                      Case list components
  dashboard/                  Dashboard components
  providers/                  React context providers
  ui/                         Shared UI primitives (badges)
lib/
  types.ts                    TypeScript interfaces
  validations.ts              Zod schemas
  db.ts                       Prisma client singleton
prisma/
  schema.prisma               Database schema (6 models)
  seed.ts                     Demo data seeder
```

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/dashboard/summary` | Dashboard metrics, priority queue, recent activity |
| GET | `/api/cases` | List cases with search, filter, sort |
| GET | `/api/cases/[id]` | Full case detail with relations |
| POST | `/api/cases/[id]/notes` | Add investigation note |
| POST | `/api/cases/[id]/decision` | Submit STR recommendation |
| PATCH | `/api/cases/[id]/decision` | Update reviewer decision |
| PATCH | `/api/cases/[id]/filing` | Update filing status |

## Demo Data

The seed script creates **5 customers** and **6 AML cases** spanning the full investigation lifecycle:

| Case | Customer | Risk Score | Status | Scenario |
|------|----------|-----------|--------|----------|
| AML-2026-0017 | Meridian Star Trading Pte Ltd | 82 | Under Review | Rapid fund pass-through via BVI/Panama entities |
| AML-2026-0021 | Eastern Horizon Imports Pte Ltd | 91 | Pending Reviewer Approval | Trade-based ML through FATF grey-list jurisdictions |
| AML-2026-0009 | Asha Global Services Pte Ltd | 45 | New | Payments to unrelated cross-industry counterparties |
| AML-2026-0023 | Tan Rui En | 38 | Pending Information | Dormant account reactivated with overseas transfers |
| AML-2026-0012 | Lim Wei Hao | 28 | Closed — No STR | Volume spike explained by bonus and CPF withdrawal |
| AML-2026-0005 | Meridian Star Trading Pte Ltd | 76 | Closed — STR Filed | Corporate funds diverted to property and offshore trust |

### Customers

| Customer | Type | Risk Rating | Profile |
|----------|------|------------|---------|
| Meridian Star Trading Pte Ltd | Corporate | Medium | Electronics distributor — 2 linked cases |
| Lim Wei Hao | Individual | Low | Software engineer — legitimate activity |
| Eastern Horizon Imports Pte Ltd | Corporate | High | Textile import/export — shell company indicators |
| Asha Global Services Pte Ltd | Corporate | Medium | IT consulting — unrelated counterparties |
| Tan Rui En | Individual | Low | Retired — dormant account reactivated |

## Role Simulation

The platform simulates three compliance roles via a client-side role selector in the sidebar. No authentication is required — switch roles to see different action visibility.

| Role | Capabilities |
|------|-------------|
| **Analyst** | View all data, add investigation notes, submit STR recommendations |
| **Reviewer** | Everything Analyst can do + approve/return STR recommendations |
| **Operations Manager** | Full read access to all cases, dashboard, and audit logs |

## Known Limitations

- **No real authentication** — roles are simulated via client-side React context; a production system would use SSO/RBAC
- **No STRO/SONAR integration** — STR filing status is tracked locally; production would integrate with Singapore's SONAR reporting system
- **Float for monetary amounts** — `Float` type used in Prisma schema; production should use `Decimal` to avoid precision issues
- **No document upload** — investigation notes are text-only; production would support file attachments for supporting evidence
- **No real-time notifications** — no WebSocket or polling for case updates; users must refresh to see changes
- **No pagination** — case list loads all cases; production would need cursor-based pagination for large datasets
- **Client-side filtering** — search and filters run client-side on the full dataset; production would use server-side filtering with database queries
