# Implementation Plan — Sample

## Summary
- Total stories: 4
- Primary scope: full-stack
- Foundation: T-01 (schema + seed data)

---

## T-01: AML Dashboard
**User Story:** As an MLRO, I want to see an overview of AML case status so I can monitor operational risk at a glance.

**Dependencies:** none (foundational)
**Agents:** architect, ui-designer, backend-engineer, frontend-engineer
**Scope:** full-stack

### Acceptance Criteria
1. Dashboard shows total open cases count
2. Dashboard shows high-risk case count
3. Dashboard shows cases pending STR filing
4. Dashboard shows recent activity feed (last 10 actions)

### Acceptance Tests (machine-verifiable)
- `GET /api/dashboard/stats` returns `{ openCases: number, highRisk: number, pendingStr: number }`
- `GET /api/dashboard/activity` returns array of recent actions
- `/dashboard` renders without errors with seed data
- Dashboard stats update when case status changes

---

## T-02: Case List with Filtering
**User Story:** As a compliance officer, I want to view and filter AML cases so I can find cases matching specific criteria.

**Dependencies:** T-01 (requires Prisma schema + seed data)
**Agents:** architect, ui-designer, backend-engineer, frontend-engineer
**Scope:** full-stack

### Acceptance Criteria
1. Case list displays all cases with key fields (ID, customer, risk, status, date)
2. Filter by status (open, closed, escalated)
3. Filter by risk level (low, medium, high, critical)
4. Sort by date, risk level, or customer name
5. Pagination (20 per page)

### Acceptance Tests (machine-verifiable)
- `GET /api/cases` returns paginated case list
- `GET /api/cases?status=open` filters correctly
- `GET /api/cases?risk=high` filters correctly
- `/cases` renders table with seed data
- Pagination controls navigate between pages

---

## T-03: Case Detail View
**User Story:** As a compliance officer, I want to view full case details including transaction history and investigation notes so I can assess suspicious activity.

**Dependencies:** T-02 (requires case list navigation)
**Agents:** architect, ui-designer, backend-engineer, frontend-engineer
**Scope:** full-stack

### Acceptance Criteria
1. Case detail shows customer profile, risk score, case status
2. Transaction timeline shows flagged transactions
3. Investigation notes section with chronological entries
4. Related alerts section
5. Action buttons: escalate, add note, change status

### Acceptance Tests (machine-verifiable)
- `GET /api/cases/[id]` returns full case with relations
- `GET /api/cases/[id]/transactions` returns transaction list
- `GET /api/cases/[id]/notes` returns investigation notes
- `/cases/[id]` renders without errors
- "Add note" action creates a note via `POST /api/cases/[id]/notes`

---

## T-04: STR Filing Workflow
**User Story:** As an MLRO, I want to prepare and submit an STR filing so I can meet regulatory obligations within the 15-day deadline.

**Dependencies:** T-03 (requires case detail for STR initiation)
**Agents:** architect, ui-designer, backend-engineer, frontend-engineer
**Scope:** full-stack

### Acceptance Criteria
1. "File STR" button on case detail (only for authorized roles)
2. STR form pre-filled from case data
3. Multi-step form: subject details → transaction details → suspicion grounds → declaration
4. Draft save capability
5. Submit action with confirmation dialog
6. Filing status tracked (draft, submitted, acknowledged)

### Acceptance Tests (machine-verifiable)
- `POST /api/str/draft` creates draft STR linked to case
- `PUT /api/str/[id]` updates draft
- `POST /api/str/[id]/submit` changes status to submitted
- `/str/new?caseId=[id]` renders pre-filled form
- Cannot submit STR without required fields filled
