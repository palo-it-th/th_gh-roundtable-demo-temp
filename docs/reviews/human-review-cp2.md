# 🧑 Human Review Required — CP-2: Architecture & Design (Batch 1)

**Checkpoint:** CP-2 — Post-context phase, first batch (SEED-001)  
**Date:** 4 May 2026  
**Reviewer action needed:** Approve / Request changes

---

## What was done

Architecture and data model design completed for the full AML/STR Case Management Platform MVP. The architecture document defines 6 Prisma models, 6 enums, 7 REST API endpoints, a case status state machine, component hierarchy, and detailed seed data — all aligned with the Singapore AML/CFT regulatory context and the CodeCademy dark design system.

No UI design document was produced for Batch 1 (SEED-001 is backend-only: schema + seed data).

---

## Artifacts reviewed

| Artifact | Path |
|----------|------|
| Architecture document | `docs/architecture/aml-case-architecture.md` |
| Implementation plan | `docs/implementation-plan.md` |
| Design system | `DESIGN.md` |
| Domain reference | `docs/reference/aml-domain-knowledge.md` |

---

## Decisions made (approve or modify)

### 1. Data Model — 6 models, 6 enums

**Decision:** Customer, AmlCase, Transaction, InvestigationNote, StrDecision, AuditLog with enums for CustomerType, RiskRating, CaseStatus, TransactionDirection, NoteType, FilingStatus.

- StrDecision is 1:1 with AmlCase (one decision record per case, updated through the workflow)
- AuditLog is append-only (no update/delete operations)
- Risk indicators stored as JSONB array on AmlCase (not a separate table)

**Why this matters:** This is the foundation for every subsequent batch. Changes later are costly (migrations, seed rewrites, API contract changes).

→ **Approve / Modify?**

---

### 2. Float for monetary amounts (not Decimal)

**Decision:** Use Prisma `Float` for `totalAmount` and transaction `amount` fields.

**Rationale:** This is a demo/investigation platform — amounts are display-only, no arithmetic. Simplifies seed data authoring.

**Risk:** Not suitable for production financial calculations. Floating-point rounding could produce display artifacts (e.g., `$9,799.999999`). Documented as known limitation.

→ **Approve / Modify?** *(Recommend: auto-approve — acceptable for demo scope. If concerned, switch to `Decimal` at minor cost.)*

---

### 3. Case status state machine (7 states)

**Decision:**
```
NEW → UNDER_REVIEW → PENDING_REVIEWER_APPROVAL → APPROVED_FOR_STR_FILING → CLOSED_STR_FILED
                   → CLOSED_NO_STR
      PENDING_INFORMATION ↔ PENDING_REVIEWER_APPROVAL (return loop)
```

- Analyst triggers: NEW→UNDER_REVIEW, UNDER_REVIEW→PENDING_REVIEWER_APPROVAL or CLOSED_NO_STR
- Reviewer triggers: PENDING_REVIEWER_APPROVAL→APPROVED_FOR_STR_FILING or PENDING_INFORMATION
- Filing close: APPROVED_FOR_STR_FILING→CLOSED_STR_FILED

**Why this matters:** Defines the entire workflow. Missing states or invalid transitions will break the demo narrative.

→ **Approve / Modify?**

---

### 4. Filing status sub-workflow (4 states)

**Decision:** NOT_STARTED → DRAFTING → READY_FOR_FILING → FILED (linear progression). Filing reference and date required only when marking as FILED.

→ **Approve / Modify?** *(Recommend: auto-approve — straightforward and matches STRO filing lifecycle.)*

---

### 5. No server-side role enforcement (client-only simulation)

**Decision:** Roles (Analyst, Reviewer, Operations Manager) are stored in React Context. API routes do **not** validate the caller's role — enforcement is UI-only via conditional rendering.

**Rationale:** No authentication system in MVP. Adding server-side role checks without auth would be security theater.

**Risk:** Any user can call any API endpoint directly. Acceptable for demo; must be flagged in deliverables as a known limitation.

→ **Approve / Modify?**

---

### 6. Seed data composition

**Decision:** 5 customers, 6 cases across all status variants, ~20 transactions, investigation notes for active cases, STR decisions where applicable, and audit log entries.

Key demo case: **AML-2026-0017** (Meridian Star Trading, risk score 82, "Rapid Movement of Funds", 4 transactions with pass-through pattern across high-risk jurisdictions).

Fully closed case with STR filed: **AML-2026-0003** (Meridian Star Trading, risk score 91, layering/shell company network, filing reference STR-2026-SG-004821).

**Why this matters:** Seed data must cover enough status variety to demonstrate every UI screen and workflow path in the demo.

→ **Approve / Modify?**

---

### 7. Service layer between API routes and Prisma

**Decision:** Business logic in `services/*.ts` (5 service files). API routes are thin — they handle HTTP parsing, Zod validation, and response formatting only.

**Rationale:** Makes business logic unit-testable with Vitest without HTTP/request mocking.

→ **Approve / Modify?** *(Recommend: auto-approve — standard pattern, low risk.)*

---

### 8. JSONB for risk indicators (no separate table)

**Decision:** `riskIndicators` stored as `Json` (PostgreSQL JSONB) on AmlCase rather than a separate `RiskIndicator` model.

**Rationale:** Indicators are a read-only string array in MVP — no need to query/filter by individual indicator.

**Trade-off:** Cannot index or query individual indicators. If a future feature needs "find all cases with indicator X", this would need a migration.

→ **Approve / Modify?** *(Recommend: auto-approve for MVP scope.)*

---

## Risks or concerns

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| 1 | **No pagination on case list** — loads all records in a single query | Low | Acceptable for 6 seeded cases. Would need pagination if data grows beyond demo. |
| 2 | **Float for money** — potential display rounding artifacts | Low | Format with `toFixed(2)` in display layer. Documented as known limitation. |
| 3 | **No server-side auth/role checks** — API endpoints are unprotected | Medium | Expected for demo. Must be prominently documented in README and known limitations. |
| 4 | **Single StrDecision per case** — no decision history | Low | Current design overwrites on return-and-resubmit. If audit of decision changes is needed, the AuditLog captures the events, but the StrDecision record itself only holds the latest state. |
| 5 | **NEW→UNDER_REVIEW transition trigger is implicit** — described as "analyst opens case / adds first note" but no explicit API endpoint for this transition | Medium | Need to decide: (a) auto-transition on first note creation, or (b) add explicit "Begin Investigation" action. Architecture doc is ambiguous here. |

---

## Recommendation

**Risk #5 is the one item requiring a decision before implementation begins.** The architecture document lists the NEW→UNDER_REVIEW transition as triggered by "analyst opens case / adds first note" but no API endpoint handles this explicitly. Options:

- **(A) Auto-transition:** First `POST /api/cases/[id]/notes` on a NEW case automatically moves status to UNDER_REVIEW. Simple, but couples note creation with status change.
- **(B) Explicit action:** Add a `PATCH /api/cases/[id]/status` endpoint (or similar) for the analyst to explicitly begin investigation. Cleaner state machine, one more endpoint.

All other decisions are sound and consistent with the implementation plan, domain knowledge, and design system.

---

## Action required

→ **Approve** all 8 decisions + pick option A or B for Risk #5  
→ **Or** request changes on specific items above

