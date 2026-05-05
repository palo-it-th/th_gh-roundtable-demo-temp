# Security Review: Batch 1 (SEED-001) — Data Model, Seed Data & DB Client

**Reviewer:** Security Advisor (automated)
**Date:** 2026-05-04
**Scope:** `prisma/schema.prisma`, `prisma/seed.ts`, `lib/db.ts`, `.env`, `docker-compose.yml`, `.env.example`, `.gitignore`

## Summary

- **Risk Level:** Medium
- **Findings:** 0 Critical, 0 High, 4 Medium, 3 Low

The Batch 1 foundation is generally well-structured with good security defaults. No hardcoded secrets in source code, no raw SQL, `.env` is gitignored, and the Prisma ORM is used consistently. The main findings are around financial data precision, audit trail tamper-evidence, dependency vulnerabilities, and encryption-at-rest considerations for AML data.

---

## Findings (by severity)

### MEDIUM

#### [MED-1] Floating-Point Type Used for Monetary Amounts

- **Location:** `prisma/schema.prisma:81` (`totalAmount Float`) and `prisma/schema.prisma:102` (`amount Float`)
- **Issue:** The `Float` type maps to PostgreSQL `DOUBLE PRECISION` (IEEE 754), which introduces rounding errors in financial arithmetic. For example, `0.1 + 0.2 ≠ 0.3` in floating-point.
- **Impact:** Monetary calculations (e.g., summing transaction amounts, threshold comparisons for STR filing) could produce inaccurate results. In an AML context, a rounding error near the SGD 20,000 reporting threshold could cause a missed filing.
- **Fix:** Change both fields to `Decimal` type in the Prisma schema:
  ```prisma
  totalAmount  Decimal  @db.Decimal(18, 2)
  amount       Decimal  @db.Decimal(18, 2)
  ```
  This maps to PostgreSQL `NUMERIC(18,2)` which provides exact decimal arithmetic.

#### [MED-2] Audit Log Has No Tamper-Evidence Mechanism

- **Location:** `prisma/schema.prisma:143-155` (AuditLog model)
- **Issue:** The audit log table is append-only by application convention only. There is no database-level mechanism to prevent UPDATE or DELETE of audit records, and no hash-chaining or digital signature to detect tampering. While `ON DELETE RESTRICT` on the foreign key prevents cascade deletes from parent records (positive), a privileged database user or compromised application could still modify log entries.
- **Impact:** In AML compliance, audit trail integrity is a regulatory requirement. Tampered logs could mask unauthorized case modifications or obstruct supervisory review.
- **Fix (later batch):**
  1. Add a database trigger to deny `UPDATE` and `DELETE` on the `audit_log` table
  2. Consider adding a `hash` column with SHA-256 of `previous_hash + current_record` for chaining
  3. As a simpler alternative, use a `previousEntryHash` field to create a verifiable chain

#### [MED-3] Moderate Dependency Vulnerabilities in PostCSS (via Next.js)

- **Location:** `package.json` → transitive dependency `postcss < 8.5.10` via `next@16.2.4`
- **Issue:** `npm audit` reports 2 moderate severity vulnerabilities: PostCSS XSS via unescaped `</style>` in CSS stringify output (GHSA-qx2v-qp2m-jg93).
- **Impact:** If user-controlled CSS values are processed through PostCSS stringify, an attacker could inject HTML/JS. Risk is low in this application since CSS is developer-authored, but the dependency should be tracked.
- **Fix:** Monitor for a Next.js patch release that updates PostCSS. Run `npm audit fix --force` only after verifying compatibility with Next.js 16.

#### [MED-4] `reviewerDecision` Is a Free-Text String Instead of an Enum

- **Location:** `prisma/schema.prisma:131` — `reviewerDecision String? // "approved" | "returned"`
- **Issue:** The comment indicates only two valid values, but the field accepts any arbitrary string. This allows invalid state to be persisted without database-level enforcement.
- **Impact:** A malformed or unexpected value in `reviewerDecision` could bypass business logic that checks for `"approved"` vs `"returned"`, potentially allowing an STR to proceed without proper reviewer authorization.
- **Fix:** Define a `ReviewerDecision` enum:
  ```prisma
  enum ReviewerDecision {
    APPROVED
    RETURNED
  }
  ```
  Then change the field to `reviewerDecision ReviewerDecision?`.

---

### LOW

#### [LOW-1] Docker Compose Uses Default PostgreSQL Credentials

- **Location:** `docker-compose.yml:6-7` — `POSTGRES_USER: postgres`, `POSTGRES_PASSWORD: postgres`
- **Issue:** The Docker Compose file uses default/weak credentials for the PostgreSQL service.
- **Impact:** Acceptable for local development. However, if this file is used as a template for staging or production deployment, these credentials would be trivially guessable.
- **Fix (informational):** Document that `docker-compose.yml` is for local development only. For non-local environments, use environment variable substitution:
  ```yaml
  POSTGRES_USER: ${POSTGRES_USER:-postgres}
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
  ```

#### [LOW-2] `console.error(e)` in Seed Script Error Handler May Log Sensitive Data

- **Location:** `prisma/seed.ts:857` — `.catch(async (e) => { console.error(e); ... })`
- **Issue:** If a Prisma error occurs during seeding, the full error object (which may include partial query data or record contents) is logged to stderr.
- **Impact:** Minimal — this is a dev-only seed script, not a production code path. Seed data is fictional.
- **Fix (informational):** For consistency with the project's no-PII-in-logs rule, consider logging only `e.message` instead of the full error object.

#### [LOW-3] `assignedAnalyst` and `author` Fields Are Plain Strings, Not User References

- **Location:** `prisma/schema.prisma:85` (`assignedAnalyst String`), `prisma/schema.prisma:116` (`author String`)
- **Issue:** Analyst and author identities are stored as free-text strings rather than foreign keys to a users/auth table. This means any arbitrary string can be written as the actor, and there is no way to verify that an audit log entry was created by a real, authenticated user.
- **Impact:** Acceptable for the current batch since authentication is documented as out-of-scope for MVP. However, this must be addressed when auth is implemented to ensure audit trail integrity per AML/CFT requirements.
- **Fix (future batch):** When the auth system is built, add a `User` model and replace these string fields with foreign key references: `assignedAnalystId String → User`, `authorId String → User`.

---

## Positive Observations

| Area | Finding |
|------|---------|
| **No hardcoded secrets** | `grep` across all `.ts`/`.tsx` files found zero instances of passwords, secrets, API keys, or tokens in source code |
| **`.env` is gitignored** | `.gitignore` includes `.env` — confirmed. The `.env.example` contains only local dev defaults |
| **DATABASE_URL uses env var** | `prisma/schema.prisma:5` uses `env("DATABASE_URL")` — no hardcoded connection string |
| **No raw SQL** | `grep` for `$queryRaw`, `$executeRaw`, and `raw(` found zero results — all queries go through Prisma ORM |
| **TypeScript compiles cleanly** | `npx tsc --noEmit` produced zero errors — no unsafe casts or type issues |
| **Fictional seed data** | All customer/company names are clearly fictional (Meridian Star Trading, Lim Wei Hao, etc.) with no real NRIC, account numbers, or financial data |
| **Seed logs are safe** | `console.log` in seed script outputs only record counts, no PII or customer data |
| **FK constraints use RESTRICT** | All foreign keys use `ON DELETE RESTRICT` — prevents accidental cascade deletion of audit logs or case data |
| **Proper Prisma singleton** | `lib/db.ts` uses the standard Next.js global singleton pattern to avoid connection pool exhaustion in development |
| **`logs/` is gitignored** | Application log directory is excluded from version control |

---

## STRIDE Threat Analysis (Batch 1 Scope)

| Threat | Assessment |
|--------|-----------|
| **Spoofing** | No auth layer exists yet (documented as out-of-scope). All actor fields are plain strings. **Risk accepted for MVP; must be addressed in auth batch.** |
| **Tampering** | Audit log has no database-level immutability controls. `ON DELETE RESTRICT` prevents cascade deletes (good), but UPDATE/DELETE by a privileged user is possible. → **MED-2** |
| **Repudiation** | Audit log model captures actor, action, details, and timestamp for every case change. However, without authenticated user references, actors are self-reported strings. → **LOW-3** |
| **Information Disclosure** | No PII in logs, no secrets in source code, `.env` gitignored. Seed data is fictional. **Well controlled.** |
| **Denial of Service** | No API endpoints exist yet in this batch. DB-level DoS via connection exhaustion is mitigated by Prisma singleton. **Low risk.** |
| **Elevation of Privilege** | No RBAC exists yet (auth is out-of-scope). When API routes are added, role-based access control must be enforced server-side. **Risk accepted for MVP.** |

---

## Automated Scan Results

### `npm audit`
```
2 moderate severity vulnerabilities
- postcss <8.5.10: XSS via unescaped </style> (GHSA-qx2v-qp2m-jg93)
  Transitive via next@16.2.4
```

### `npx tsc --noEmit`
```
0 errors
```

### Hardcoded secrets scan (`grep`)
```
0 matches in .ts/.tsx files
0 matches in .yml/.yaml files
```

### Raw SQL scan (`grep`)
```
0 matches for $queryRaw, $executeRaw, or raw() calls
```

---

## Recommendations

1. **Before Batch 2:** Fix MED-1 (Float → Decimal for monetary fields). This is foundational — changing the type later requires a data migration.
2. **Before Batch 2:** Fix MED-4 (reviewerDecision enum). Schema changes are cheapest before API routes depend on the model.
3. **In Auth batch:** Address LOW-3 by linking `assignedAnalyst`/`author` to authenticated user records.
4. **In Auth batch:** Implement RBAC with server-side enforcement for all API routes.
5. **Before production:** Address MED-2 with a database trigger preventing audit log modification.
6. **Ongoing:** Monitor `npm audit` for PostCSS patch via Next.js update (MED-3).
