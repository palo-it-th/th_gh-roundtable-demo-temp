# Security Review: Batch 6 (REVIEW-001, FILE-001) — Reviewer Decision & Filing Status

**Reviewer:** Security Advisor (automated)
**Date:** 2026-05-04
**Scope:** `app/api/cases/[id]/decision/route.ts` (PATCH handler), `app/api/cases/[id]/filing/route.ts`, `components/case-detail/reviewer-decision-form.tsx`, `components/case-detail/filing-status-form.tsx`, `lib/validations.ts` (reviewer + filing schemas)

## Summary

- **Risk Level:** High
- **Findings:** 1 Critical, 1 High, 5 Medium, 3 Low

One Critical finding — **no server-side authentication on reviewer decision and filing endpoints** — blocks production deployment. The reviewer approval endpoint is the final gate before STR filing with STRO; without auth, any unauthenticated caller can approve cases for filing. One High finding — **hardcoded audit actor enables undetectable impersonation** — compounds the Critical finding. The Zod discriminated unions are well-structured and provide solid schema validation. No raw SQL, no `dangerouslySetInnerHTML`, proper `encodeURIComponent` on client URLs, and transactional writes with audit logging are positive patterns.

---

## Findings (by severity)

### CRITICAL

#### [CRIT-1] No Server-Side Authentication or Authorization on Reviewer Decision & Filing Endpoints

- **Location:** `app/api/cases/[id]/decision/route.ts:101-196` (PATCH handler — reviewer decision)
- **Location:** `app/api/cases/[id]/filing/route.ts:6-94` (PATCH handler — filing status)
- **Issue:** Neither endpoint implements any authentication or authorization. There is no `middleware.ts` in the project. The client-side role guard (`role !== "Reviewer"`) in `reviewer-decision-form.tsx:32` and `filing-status-form.tsx:42` is purely cosmetic — it hides UI elements but does not prevent direct API calls.

  Any unauthenticated HTTP client can:
  1. **Approve cases for STR filing** by sending `PATCH /api/cases/{id}/decision` with `{ "reviewerDecision": "approved" }`
  2. **Mark an STR as filed** by sending `PATCH /api/cases/{id}/filing` with `{ "filingStatus": "FILED", "filingReference": "FAKE-REF", "filedAt": "2026-05-04" }`
  3. **Return cases to analyst** by sending `PATCH /api/cases/{id}/decision` with `{ "reviewerDecision": "returned", "reviewerComment": "..." }`

  The reviewer approval is the **critical control gate** in the AML workflow — it separates analyst assessment from STR filing authority. Without server-side enforcement, this gate is effectively non-existent.

  ```bash
  # Proof of concept — no auth headers, cookies, or tokens required:
  curl -X PATCH http://localhost:3000/api/cases/<caseId>/decision \
    -H "Content-Type: application/json" \
    -d '{"reviewerDecision":"approved"}'
  ```

- **Impact:** Complete bypass of the maker-checker control required by MAS AML/CFT guidelines. An attacker (or compromised analyst account) can self-approve cases and initiate STR filings without reviewer oversight, undermining the entire compliance workflow.
- **STRIDE:** Spoofing (impersonate reviewer), Elevation of Privilege (analyst → reviewer), Tampering (modify case workflow state)
- **OWASP:** A01:2021 Broken Access Control
- **Fix:**
  1. **Immediate:** Add authentication middleware (`middleware.ts`) that validates session/JWT on all `/api/cases/*/decision` and `/api/cases/*/filing` routes.
  2. **Authorization:** Verify the authenticated user has the `Reviewer` role before processing PATCH requests on these endpoints:
     ```typescript
     // In the PATCH handler, after authentication:
     const session = await getServerSession(authOptions);
     if (!session || session.user.role !== 'Reviewer') {
       return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
     }
     ```
  3. **Audit:** Derive the audit log `actor` from the verified session, not a hardcoded string.

---

### HIGH

#### [HIGH-1] Hardcoded Audit Log Actor Enables Undetectable Impersonation

- **Location:** `app/api/cases/[id]/decision/route.ts:175` — `actor: 'Reviewer'`
- **Location:** `app/api/cases/[id]/filing/route.ts:71` — `actor: 'Reviewer'`
- **Issue:** Both PATCH endpoints hardcode the audit log actor as `'Reviewer'`. Combined with CRIT-1 (no authentication), **any caller's actions are attributed to "Reviewer" in the audit trail**. An attacker who approves a case or files an STR leaves behind audit entries indistinguishable from legitimate reviewer actions.

  In the reviewer decision handler:
  ```typescript
  await tx.auditLog.create({
    data: {
      caseId: id,
      actor: 'Reviewer',           // ← hardcoded, not from session
      action: 'Reviewer Decision',
      details: `Decision: ${reviewerDecision}...`,
    },
  });
  ```

  In the filing status handler:
  ```typescript
  await tx.auditLog.create({
    data: {
      caseId: id,
      actor: 'Reviewer',           // ← hardcoded, not from session
      action: 'Filing Status Updated',
      details: `Filing status changed to ${filingStatus}...`,
    },
  });
  ```

- **Impact:** The AML audit trail — required by MAS Notice 626 — becomes unreliable. Unauthorized actions cannot be distinguished from legitimate reviewer actions during regulatory examinations. This constitutes a **repudiation** vulnerability.
- **STRIDE:** Repudiation, Spoofing
- **Fix:** Derive actor identity from the authenticated session (requires CRIT-1 fix first):
  ```typescript
  actor: session.user.email ?? session.user.name,
  ```

---

### MEDIUM

#### [MED-1] `filedAt` Date Accepts Arbitrary Strings — No ISO Format or Range Validation

- **Location:** `lib/validations.ts:78` — `filedAt: z.string().min(1, 'Filing date is required')`
- **Location:** `app/api/cases/[id]/filing/route.ts:55` — `filedAt: filedAt ? new Date(filedAt) : null`
- **Issue:** The `filedAt` field is validated only as a non-empty string, then passed to JavaScript's `new Date()` constructor. This constructor parses many ambiguous formats:
  - `"0"` → `2000-01-01T00:00:00.000Z`
  - `"99999"` → `Invalid Date`
  - `"2099-12-31"` → future date (no range check)
  - `"1970-01-01"` → date before the investigation existed

  While there is no SQL injection risk (Prisma parameterizes the query), invalid or absurd dates corrupt the filing record. There is no injection vector since `new Date()` returns a `Date` object consumed by Prisma, not interpolated into SQL.

- **Impact:** Data integrity — an STR filing with an absurd `filedAt` date (e.g., year 2099) would pass validation and be stored. This could cause issues during regulatory reporting.
- **STRIDE:** Tampering
- **Fix:** Use Zod's `.date()` or `.datetime()` for strict ISO 8601 validation, plus range constraints:
  ```typescript
  filedAt: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format')
    .refine((d) => !isNaN(Date.parse(d)), 'Invalid date')
    .refine((d) => new Date(d) <= new Date(), 'Filing date cannot be in the future'),
  ```

#### [MED-2] `filingReference` Has No Format Constraint or Max Length

- **Location:** `lib/validations.ts:77` — `filingReference: z.string().min(1, 'Filing reference is required')`
- **Issue:** The filing reference should correspond to a SONAR system reference number (Singapore's STR filing platform). The current schema accepts any non-empty string — including multi-megabyte payloads, special characters, or values that don't match the expected SONAR format.

  This is stored directly in the database (`str_decisions.filingReference`) and interpolated into the audit log details string:
  ```typescript
  // filing/route.ts:74
  details: `Filing status changed to ${filingStatus}${filingReference ? ` — Reference: ${filingReference}` : ''}`,
  ```

- **Impact:** (1) Storage abuse via unbounded string length. (2) Audit log pollution — a multi-megabyte `filingReference` bloats every audit log entry. (3) No validation that the reference is a legitimate SONAR reference format, allowing fabricated references.
- **STRIDE:** Tampering, Denial of Service
- **Fix:**
  ```typescript
  filingReference: z.string()
    .min(1, 'Filing reference is required')
    .max(100, 'Filing reference too long')
    .regex(/^[A-Z0-9\-]+$/, 'Filing reference must contain only uppercase letters, digits, and hyphens'),
  ```

#### [MED-3] `reviewerComment` Has No Max Length Constraint

- **Location:** `lib/validations.ts:62` — `reviewerComment: z.string().min(1, 'Comment is required when returning a case')`
- **Issue:** Consistent with the Batch 5 finding (MED-1), the `reviewerComment` field in the `reviewerDecisionSchema` has no `.max()` constraint. A multi-megabyte comment passes validation and is stored in the database and interpolated into the audit log:
  ```typescript
  // decision/route.ts:176
  details: `Decision: ${reviewerDecision}${reviewerComment ? ` — Comment: ${reviewerComment}` : ''} — status changed to ${newStatus}`,
  ```

- **Impact:** Denial of service via storage exhaustion and audit log bloat.
- **STRIDE:** Denial of Service
- **Fix:**
  ```typescript
  reviewerComment: z.string().min(1).max(5000, 'Comment too long'),
  ```

#### [MED-4] TOCTOU Race on Both PATCH Endpoints — Status Check Outside Transaction

- **Location:** `app/api/cases/[id]/decision/route.ts:110-124` (status read), `app/api/cases/[id]/decision/route.ts:149-181` (transaction)
- **Location:** `app/api/cases/[id]/filing/route.ts:14-29` (status read), `app/api/cases/[id]/filing/route.ts:48-82` (transaction)
- **Issue:** Both PATCH endpoints follow the same pattern: read case status via `findUnique` **outside** the transaction, validate the status, then execute the `$transaction` block. Two concurrent requests can both pass the status check before either commits:
  - **Decision:** Two reviewers both see `PENDING_REVIEWER_APPROVAL`, one approves while the other returns → conflicting state transitions.
  - **Filing:** Two concurrent PATCH requests, one sets `DRAFTING` while the other sets `FILED` → the last write wins silently.

  This is the same pattern flagged in Batch 5 (MED-3).
- **Impact:** Data loss from concurrent overwrites and conflicting audit log entries. In the filing scenario, a case could be marked FILED with a reference number, then have that overwritten by a concurrent DRAFTING update.
- **STRIDE:** Tampering, Repudiation
- **Fix:** Move the status check inside the transaction:
  ```typescript
  const result = await prisma.$transaction(async (tx) => {
    const amlCase = await tx.amlCase.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!amlCase || amlCase.status !== 'PENDING_REVIEWER_APPROVAL') {
      throw new Error('INVALID_STATUS');
    }
    // ... rest of transaction
  });
  ```

#### [MED-5] Filing Status Allows Backward Transitions

- **Location:** `app/api/cases/[id]/filing/route.ts:33-36` — validates against `updateFilingSchema` only
- **Location:** `lib/validations.ts:68-80` — `updateFilingSchema` discriminated union
- **Issue:** The `updateFilingSchema` validates that `filingStatus` is one of `DRAFTING`, `READY_FOR_FILING`, or `FILED`, but does **not** enforce forward-only progression. A user can transition from `READY_FOR_FILING` back to `DRAFTING`, or from `FILED` back to `DRAFTING` (if the case status check doesn't block it). The only server-side guard is that the case must be in `APPROVED_FOR_STR_FILING` status — but this doesn't change until `FILED` is set, so backward transitions among `DRAFTING` → `READY_FOR_FILING` are unrestricted.
- **Impact:** STR filing workflow integrity — a reviewer could inadvertently (or maliciously) regress a filing that was ready for submission.
- **STRIDE:** Tampering
- **Fix:** Track the current `filingStatus` on the `StrDecision` record and enforce allowed transitions:
  ```typescript
  const ALLOWED_TRANSITIONS: Record<string, string[]> = {
    NOT_STARTED: ['DRAFTING'],
    DRAFTING: ['READY_FOR_FILING'],
    READY_FOR_FILING: ['FILED'],
    FILED: [],  // terminal state
  };
  ```

---

### LOW

#### [LOW-1] Validation Error Responses Expose Zod Issue Details

- **Location:** `app/api/cases/[id]/decision/route.ts:133` — `details: parsed.error.issues`
- **Location:** `app/api/cases/[id]/filing/route.ts:36` — `details: parsed.error.issues`
- **Issue:** Both PATCH handlers return raw `parsed.error.issues` in 400 responses, revealing internal schema structure (field names, validation rules, discriminator values). Consistent with Batch 5 finding (LOW-1).
- **Impact:** Low — accelerates API reconnaissance but does not directly enable exploitation.
- **Fix:** Use `parsed.error.flatten().fieldErrors` for a less verbose response.

#### [LOW-2] Path Parameter `id` Not Validated as CUID Format

- **Location:** `app/api/cases/[id]/decision/route.ts:104` — `const { id } = await params;`
- **Location:** `app/api/cases/[id]/filing/route.ts:10` — `const { id } = await params;`
- **Issue:** Route param `id` is passed directly to Prisma without format validation. Prisma handles this safely (no injection), but arbitrary strings cause unnecessary database round-trips. Consistent with Batch 5 finding (LOW-2).
- **Impact:** Negligible. Defense-in-depth concern only.
- **Fix:** Add `z.string().cuid()` validation on the `id` parameter.

#### [LOW-3] Client-Side `validate()` Function in `ReviewerDecisionForm` Is Dead Code

- **Location:** `components/case-detail/reviewer-decision-form.tsx:37-43` — `function validate(): boolean`
- **Issue:** The `validate()` function is defined but never called. The `handleSubmit` function performs its own inline validation (line 50-53). This dead code adds maintenance burden and could cause confusion if a developer calls `validate()` expecting it to set errors identically to `handleSubmit`.
- **Impact:** Negligible security impact. Code quality concern.
- **Fix:** Remove the unused `validate()` function.

---

## Positive Observations

| Control | Evidence |
|---------|----------|
| **Discriminated union Zod schemas** | `reviewerDecisionSchema` (approved vs. returned) and `updateFilingSchema` (DRAFTING vs. READY_FOR_FILING vs. FILED) correctly enforce conditional required fields via `z.discriminatedUnion()` |
| **Status transition guards on both endpoints** | Decision PATCH requires `PENDING_REVIEWER_APPROVAL`; Filing PATCH requires `APPROVED_FOR_STR_FILING` |
| **Transactional writes with audit logging** | Both PATCH handlers use `prisma.$transaction()` to atomically update decision + case status + audit entry |
| **Prisma ORM exclusively — no raw SQL** | Zero `$queryRaw` or `$executeRaw` calls across the codebase |
| **No `dangerouslySetInnerHTML`** | Zero instances in application code (confirmed via grep) |
| **`encodeURIComponent` on client URL params** | `reviewer-decision-form.tsx:62` and `filing-status-form.tsx:72` both encode `caseId` |
| **Generic 500 error messages** | Both handlers return `"Failed to process reviewer decision"` / `"Failed to update filing status"` — no stack traces |
| **Client-side validation mirrors server schema** | Both forms validate required fields client-side before submission |
| **`data-testid` on all interactive elements** | Both forms include test IDs for E2E coverage |
| **TypeScript strict mode — clean `tsc --noEmit`** | Zero type errors across the codebase |
| **No hardcoded secrets** | `grep` for `password`, `secret`, `api_key`, `token` across `app/`, `lib/`, `components/` returned zero results |

---

## STRIDE Analysis

| Threat | Assessment |
|--------|-----------|
| **Spoofing** | **CRIT-1**: No authentication — any caller can impersonate a Reviewer. Client-side `useRole()` is trivially bypassed. |
| **Tampering** | **MED-1**: Arbitrary date strings stored as filing dates. **MED-4**: TOCTOU race allows concurrent overwrites. **MED-5**: Backward filing status transitions permitted. |
| **Repudiation** | **HIGH-1**: Audit log actor hardcoded to `'Reviewer'` — unauthorized actions indistinguishable from legitimate ones. Audit entries exist (positive) but are unreliable without auth. |
| **Information Disclosure** | **LOW-1**: Zod schema details in 400 responses. API 500 responses are properly generic. No PII in error messages. |
| **Denial of Service** | **MED-2, MED-3**: Unbounded `filingReference` and `reviewerComment` strings. No rate limiting on endpoints (pre-existing from Batch 2). |
| **Elevation of Privilege** | **CRIT-1**: Any user (or unauthenticated caller) can exercise Reviewer-only actions — approve cases, file STRs, return cases. |

---

## OWASP Top 10 Coverage

| OWASP Category | Status | Finding |
|---------------|--------|---------|
| A01: Broken Access Control | **FAIL** | CRIT-1 — no authentication or authorization |
| A02: Cryptographic Failures | N/A | No encryption in scope (DB at-rest encryption is infra-level) |
| A03: Injection | **PASS** | Prisma ORM parameterizes all queries; no raw SQL; no `dangerouslySetInnerHTML` |
| A04: Insecure Design | **FAIL** | MED-5 — missing forward-only state machine for filing status |
| A05: Security Misconfiguration | **INFO** | No security headers configured in `next.config.ts` (pre-existing) |
| A06: Vulnerable Components | **INFO** | 2 moderate `npm audit` findings (PostCSS XSS in CSS stringify — low practical risk for server-rendered app) |
| A07: Auth Failures | **FAIL** | CRIT-1 — no authentication mechanism exists |
| A08: Data Integrity Failures | **FAIL** | MED-4 — TOCTOU race; HIGH-1 — spoofable audit trail |
| A09: Logging Failures | **PARTIAL** | Audit logs exist but actor identity is unreliable (HIGH-1) |
| A10: SSRF | N/A | No outbound HTTP requests in scope |

---

## Automated Scan Results

### `npm audit`
```
2 moderate severity vulnerabilities
- postcss <8.5.10 — XSS via unescaped </style> in CSS stringify output
  (dependency of next; fix requires breaking change to next@9.x)
```

### `npx tsc --noEmit`
```
0 errors — clean compilation
```

### Hardcoded secrets scan
```
grep -rn "password|secret|api_key|token" across app/, lib/, components/
0 matches in production code
```

---

## Recommendations (Priority Order)

1. **[BLOCKING] Implement server-side authentication and role-based authorization** on all `/api/cases/*/decision` and `/api/cases/*/filing` routes. This is the single highest-priority fix across all batches.
2. **[BLOCKING] Derive audit log `actor` from authenticated session** — never hardcode or accept from client.
3. Add ISO date format validation and range constraints on `filedAt`.
4. Add format constraint and max length on `filingReference`.
5. Add max length on `reviewerComment`.
6. Move status checks inside `$transaction` blocks to prevent TOCTOU races.
7. Enforce forward-only filing status transitions.
8. Remove dead `validate()` function from `ReviewerDecisionForm`.
