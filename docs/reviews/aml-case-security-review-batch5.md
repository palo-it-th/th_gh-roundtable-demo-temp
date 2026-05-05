# Security Review: Batch 5 (NOTE-001, DECIDE-001) — Mutation Endpoints & Client Forms

**Reviewer:** Security Advisor (automated)
**Date:** 2026-05-04
**Scope:** `app/api/cases/[id]/notes/route.ts`, `app/api/cases/[id]/decision/route.ts`, `components/case-detail/note-form.tsx`, `components/case-detail/decision-form.tsx`, `lib/validations.ts`

## Summary

- **Risk Level:** Medium
- **Findings:** 0 Critical, 1 High, 4 Medium, 3 Low

One High finding — **author spoofing on the notes endpoint** — should be addressed before production. No Critical findings. The codebase shows solid patterns: Zod validation on both mutation routes, Prisma ORM exclusively (no raw SQL), proper `encodeURIComponent` on client-side URL interpolation, transactional writes with audit logging, generic 500 error messages, and no `dangerouslySetInnerHTML`. The main gaps are unbounded string fields, missing status guards on the notes endpoint, and a TOCTOU race on the decision endpoint.

---

## Findings (by severity)

### HIGH

#### [HIGH-1] Client-Controlled `author` Field Enables Audit Trail Spoofing

- **Location:** `app/api/cases/[id]/notes/route.ts:36` — `const { noteType, content, author } = parsed.data;`
- **Linked client code:** `components/case-detail/note-form.tsx:53` — `author: role` (from client-side `useRole()`)
- **Issue:** The `author` field in the `addNoteSchema` is an unconstrained `z.string().min(1)` sourced entirely from the request body. The client populates it from a client-side role selector (`useRole()`), which any caller can override. An unauthenticated HTTP request can attribute notes to any identity — "MLRO", "Reviewer", "Regulator", or any arbitrary string. The server performs **no validation** of the author against any session, token, or allowlist.
- **Impact:** The investigation audit trail — a regulatory requirement under Singapore AML/CFT rules — can be fabricated. An attacker can insert notes attributed to senior compliance officers, creating false evidence of review or masking unauthorized activity.
- **STRIDE:** Spoofing, Repudiation, Tampering
- **Fix:**
  1. **Short term:** Constrain `author` to a Zod enum of valid roles: `z.enum(['Analyst', 'Reviewer', 'Operations Manager'])`.
  2. **Production:** Derive the author from a server-side session/JWT — never trust the client to self-identify.

---

### MEDIUM

#### [MED-1] No `maxLength` Constraint on Any Mutation String Fields

- **Location:** `lib/validations.ts:35-36` (`addNoteSchema`), `lib/validations.ts:43-44` (`submitDecisionSchema`)
- **Issue:** All string fields use `.min(1)` but have **no `.max()` constraint**:
  - `content` — investigation note body (unbounded)
  - `author` — author identity (unbounded)
  - `suspicionReason` — suspicion rationale (unbounded)
  - `analystRecommendation` — analyst recommendation text (unbounded)

  An attacker can submit multi-megabyte strings in a single POST, causing:
  1. Memory pressure during JSON parsing and Zod validation
  2. Large writes filling database storage
  3. UI rendering issues when displaying oversized content
- **Impact:** Denial of service via resource exhaustion. The `InvestigationNote.content` column is unbounded `String` in Prisma (maps to PostgreSQL `TEXT`).
- **STRIDE:** Denial of Service
- **Fix:** Add reasonable max-length constraints:
  ```typescript
  export const addNoteSchema = z.object({
    noteType: NoteTypeEnum,
    content: z.string().min(1, 'Content is required').max(10000, 'Content too long'),
    author: z.string().min(1, 'Author is required').max(100, 'Author too long'),
  });

  export const submitDecisionSchema = z.object({
    suspicionEstablished: z.boolean(),
    suspicionReason: z.string().min(1).max(10000, 'Reason too long'),
    analystRecommendation: z.string().min(1).max(10000, 'Recommendation too long'),
  });
  ```

#### [MED-2] Notes Can Be Added to Closed Cases

- **Location:** `app/api/cases/[id]/notes/route.ts:24-30` — case lookup; no status guard
- **Issue:** The notes endpoint verifies the case exists (line 26) but does **not** check whether the case is in a terminal state (`CLOSED_NO_STR` or `CLOSED_STR_FILED`). Notes can be added to closed cases, violating the case lifecycle.

  Contrast with the decision endpoint (`app/api/cases/[id]/decision/route.ts:6`), which correctly restricts to `UNDER_REVIEW` and `PENDING_INFORMATION` only.
- **Impact:** Case integrity violation. Closed AML investigations should be immutable. Adding notes post-closure could be exploited to alter the evidentiary record after a regulatory review.
- **STRIDE:** Tampering
- **Fix:** Add a status guard before the transaction:
  ```typescript
  const CLOSED_STATUSES = ['CLOSED_NO_STR', 'CLOSED_STR_FILED'] as const;
  if (CLOSED_STATUSES.includes(amlCase.status as any)) {
    return NextResponse.json(
      { error: 'Cannot add notes to a closed case' },
      { status: 409 }
    );
  }
  ```

#### [MED-3] TOCTOU Race Condition on Decision Status Check

- **Location:** `app/api/cases/[id]/decision/route.ts:17-23` (status read), `app/api/cases/[id]/decision/route.ts:51-84` (transaction)
- **Issue:** The status validation (`findUnique` on line 17) occurs **outside** the `$transaction` block (line 51). Two concurrent decision submissions can both pass the status check (both see `UNDER_REVIEW`), then both execute the transaction:
  1. First request: upserts decision, transitions case to `PENDING_REVIEWER_APPROVAL`
  2. Second request: also upserts (overwrites) the decision, transitions to `PENDING_REVIEWER_APPROVAL` again

  The upsert silently overwrites the first decision's data. Two conflicting audit log entries are created.
- **Impact:** Decision data loss and audit trail pollution. In an AML context, the overwritten decision rationale could differ from what the first analyst submitted, creating regulatory risk.
- **STRIDE:** Tampering, Repudiation
- **Fix:** Move the status check inside the transaction and use a `SELECT ... FOR UPDATE` pattern:
  ```typescript
  const result = await prisma.$transaction(async (tx) => {
    const amlCase = await tx.amlCase.findUnique({
      where: { id },
      select: { id: true, caseNumber: true, status: true },
    });
    if (!amlCase || !VALID_STATUSES_FOR_RECOMMENDATION.includes(amlCase.status as any)) {
      throw new Error('INVALID_STATUS');
    }
    // ... rest of transaction
  });
  ```
  Prisma interactive transactions use `SELECT ... FOR UPDATE` implicitly when you read-then-write within the same transaction, preventing concurrent overwrites.

#### [MED-4] Decision Endpoint Hardcodes Actor as `'Analyst'`

- **Location:** `app/api/cases/[id]/decision/route.ts:80` — `actor: 'Analyst'`
- **Issue:** The audit log entry hardcodes the actor as `'Analyst'` regardless of who actually submitted the request. If a Reviewer or Operations Manager submits a decision (e.g., in an override scenario), the audit trail falsely attributes the action to an Analyst.

  Compare with the notes endpoint, which at least uses the client-supplied `author` value (see HIGH-1).
- **Impact:** Inaccurate audit trail. Regulatory investigators reviewing the audit log would see a false actor for decision submissions.
- **STRIDE:** Repudiation
- **Fix:** Accept the actor identity from the request (short term) or derive from server-side session (production):
  ```typescript
  // In submitDecisionSchema, add:
  actor: z.enum(['Analyst', 'Reviewer', 'Operations Manager']),
  ```
  Then use `parsed.data.actor` in the audit log. This has the same spoofing limitation as HIGH-1, but is better than a hardcoded value.

---

### LOW

#### [LOW-1] Validation Error Response Exposes Zod Issue Details

- **Location:** `app/api/cases/[id]/notes/route.ts:17` — `details: parsed.error.issues`
- **Location:** `app/api/cases/[id]/decision/route.ts:44` — `details: parsed.error.issues`
- **Issue:** Both endpoints return the raw `parsed.error.issues` array in the 400 response. While Zod issues don't contain secrets, they reveal internal schema structure — field names, validation rules, expected types, and enum values. This aids API reconnaissance.
- **Impact:** Low. Schema structure is discoverable anyway via trial-and-error, but exposing it directly accelerates attacker reconnaissance.
- **Fix:** Use `parsed.error.flatten()` for a less verbose structure, or return only field-level error messages:
  ```typescript
  return NextResponse.json(
    { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
    { status: 400 }
  );
  ```

#### [LOW-2] Path Parameter `id` Not Validated as CUID Format

- **Location:** `app/api/cases/[id]/notes/route.ts:10` — `const { id } = await params;`
- **Location:** `app/api/cases/[id]/decision/route.ts:14` — `const { id } = await params;`
- **Issue:** The `id` from route params is used directly in `prisma.amlCase.findUnique({ where: { id } })` without validating it matches the expected CUID format (`^c[a-z0-9]{24}$`). While Prisma handles this safely (no SQL injection), arbitrary strings cause unnecessary database round-trips.
- **Impact:** Negligible direct impact, but violates defense-in-depth. Could contribute to DoS if combined with automated scanning.
- **Fix:** Add a CUID format check:
  ```typescript
  const idSchema = z.string().cuid();
  const idResult = idSchema.safeParse(id);
  if (!idResult.success) {
    return NextResponse.json({ error: 'Invalid case ID' }, { status: 400 });
  }
  ```

#### [LOW-3] Decision Upsert Can Overwrite In-Progress STR Filing

- **Location:** `app/api/cases/[id]/decision/route.ts:53-67` — `strDecision.upsert`
- **Issue:** The upsert's `update` branch overwrites `suspicionEstablished`, `suspicionReason`, and `analystRecommendation` without checking the current `filingStatus`. If a decision record already exists with `filingStatus: 'DRAFTING'` or `'READY_FOR_FILING'`, the upsert silently overwrites the analyst assessment while the STR filing is in progress.

  The status guard (`VALID_STATUSES_FOR_RECOMMENDATION`) blocks cases already in `PENDING_REVIEWER_APPROVAL` or later states, so in normal flow this upsert path is unreachable. But if a case is somehow returned to `UNDER_REVIEW` (e.g., by a reviewer returning it), the upsert could overwrite a partially-drafted STR.
- **Impact:** Low probability, but could disrupt an in-progress STR filing workflow.
- **Fix:** Inside the transaction, read the existing decision and check `filingStatus` before upserting:
  ```typescript
  const existing = await tx.strDecision.findUnique({ where: { caseId: id } });
  if (existing && existing.filingStatus !== 'NOT_STARTED') {
    throw new Error('FILING_IN_PROGRESS');
  }
  ```

---

## Positive Observations

| Control | Evidence |
|---------|----------|
| **Zod validation on both mutation routes** | `addNoteSchema` and `submitDecisionSchema` are applied via `.safeParse()` with proper 400 responses |
| **Prisma ORM exclusively — no raw SQL** | `grep` for `$queryRaw`, `$executeRaw` returns zero results across `app/`, `lib/`, `components/` |
| **Transactional writes with audit logging** | Both endpoints use `prisma.$transaction()` to atomically create records + audit entries |
| **No `dangerouslySetInnerHTML`** | `grep` across all `.tsx` files returns zero results in application code |
| **Generic 500 error messages** | Both routes return `"Failed to add investigation note"` / `"Failed to submit recommendation"` — no stack traces or DB details |
| **`encodeURIComponent` on client-side URL params** | `note-form.tsx:50`, `decision-form.tsx:63` both use `encodeURIComponent(caseId)` |
| **Decision endpoint has status transition guard** | Only `UNDER_REVIEW` and `PENDING_INFORMATION` are allowed — prevents decisions on new, closed, or already-decided cases |
| **Client forms have `data-testid` attributes** | Both forms include `data-testid` on all interactive elements for E2E testing |
| **Client-side validation mirrors server-side** | Both forms validate required fields before submission, reducing unnecessary server round-trips |

---

## STRIDE Analysis

| Threat | Assessment |
|--------|-----------|
| **Spoofing** | **HIGH-1**: `author` field is client-controlled; anyone can impersonate any role. **MED-4**: Decision actor hardcoded to 'Analyst'. No authentication middleware on either endpoint. |
| **Tampering** | **MED-2**: Notes can be added to closed cases. **MED-3**: TOCTOU race on decision status check allows concurrent overwrites. Data at rest uses Prisma-managed writes (safe against SQL injection). |
| **Repudiation** | Audit logs exist for both endpoints (positive), but actor identity is unreliable (HIGH-1, MED-4). Without server-side auth, audit entries cannot be cryptographically bound to a verified identity. |
| **Information Disclosure** | **LOW-1**: Zod error details expose schema structure. API 500 responses are properly generic. No PII in error messages. `console.error` logs full error objects server-side — acceptable if log aggregation is restricted. |
| **Denial of Service** | **MED-1**: Unbounded string fields allow multi-MB payloads. No rate limiting on mutation endpoints (noted as pre-existing from Batch 2 review). |
| **Elevation of Privilege** | No role-based access control — both endpoints are publicly accessible. Known limitation. The decision endpoint doesn't restrict submissions to Analysts only. |

---

## Recommendations

1. **Before production (High priority):**
   - Add `maxLength` constraints to all Zod string fields (MED-1)
   - Add status guard on notes endpoint to reject closed cases (MED-2)
   - Move decision status check inside the transaction (MED-3)
   - Constrain `author` to a valid role enum at minimum (HIGH-1)

2. **Production readiness:**
   - Implement server-side authentication and derive actor/author from session
   - Add rate limiting middleware on all mutation endpoints
   - Validate path `id` parameters as CUID format (LOW-2)

3. **Deferred (tracked in backlog):**
   - Add filing status guard on decision upsert (LOW-3)
   - Switch from `parsed.error.issues` to `parsed.error.flatten().fieldErrors` (LOW-1)
