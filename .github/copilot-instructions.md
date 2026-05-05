# AML / STR Case Management Platform — Copilot Instructions

These instructions apply to **every** Copilot interaction in this repository.

---

## Project Overview

**AML (Anti-Money Laundering) / STR (Suspicious Transaction Report) Case Management Platform** for a Singapore-based bank. Compliance officers and MLROs manage AML investigations, assess risk, and file STRs with STRO via the SONAR system.

**Regulatory context:** AML/CFT compliance for Singapore banking.

**Domain reference:** For AML/CFT domain context (terminology, workflows, risk levels, entity model, business rules), read `docs/reference/aml-domain-knowledge.md`.

**Design system:** When working on UI components or frontend, read `DESIGN.md` at the project root for design tokens, typography, spacing, and visual identity rules.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + shadcn/ui |
| ORM | Prisma |
| Database | PostgreSQL |
| Unit/Integration tests | Vitest |
| E2E tests | Playwright |
| Package manager | npm |

---

## Coding Standards

### TypeScript

- `strict: true` — no `any` types unless explicitly justified
- Explicit return types on exported functions
- Prefer `interface` over `type` for object shapes
- `const` by default; `let` only when needed; never `var`

### Naming

| Element | Convention | Example |
|---------|-----------|---------|
| Components | PascalCase | `CaseDetailPanel.tsx` |
| Utilities | camelCase | `formatCurrency.ts` |
| API routes | kebab-case dirs | `app/api/cases/[id]/route.ts` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Types/Interfaces | PascalCase | `AmlCase`, `StrFilingStatus` |
| DB tables | snake_case | `aml_cases` |
| Prisma models | PascalCase | `AmlCase` |

### File Structure

```
app/                    ← Next.js App Router pages + API routes
components/             ← Reusable React components
  ui/                   ← shadcn/ui primitives
services/               ← Business logic layer
lib/                    ← Shared utilities, types, db client
prisma/                 ← Schema + migrations
data/                   ← Seed data
tests/                  ← Test files
docs/                   ← Generated docs
logs/                   ← Audit trail
```

### Import Order

1. React / Next.js → 2. Third-party → 3. `@/` aliases → 4. Relative → 5. Type-only

### Error Handling

- API routes: structured JSON errors with HTTP status codes
- Services: throw typed errors
- Components: error boundaries + inline handling
- Never swallow errors silently

### React / Next.js

- Server Components by default; `"use client"` only when needed
- Use `loading.tsx` and `error.tsx` for route-level states
- shadcn/ui only — no additional UI libraries
- `data-testid` on key elements for Playwright

---

## Testing

- **Vitest:** `*.test.ts(x)` — business logic + API routes
- **Playwright:** `*.spec.ts` in `tests/e2e/` — critical user flows
- Use `data-testid` selectors, not CSS classes

## Commit Format

`<type>(<scope>): <short description>` — types: feat, fix, refactor, test, docs, chore

---

## Key Rules

1. Never hardcode credentials — use environment variables
2. Never log PII — no customer names/IDs/financial data in logs
3. All API routes must validate input with Zod schemas
4. All database queries via Prisma — no raw SQL unless justified
5. Every feature needs tests
