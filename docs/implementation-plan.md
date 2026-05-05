# Implementation Plan — AML / STR Case Management Platform

Generated from: `docs/transcript.md`  
Date: 4 May 2026

---

## Actors

| Role | Description |
|------|-------------|
| AML Analyst | Investigates cases, adds notes, submits recommendations |
| Compliance Reviewer | Reviews analyst recommendations, approves/returns decisions |
| Operations Manager | Views dashboard, manages workload, assigns cases |
| System | Generates audit log entries, enforces validation rules |

---

## Feature Areas

1. **Data Model & Seed Data** — Prisma schema, seed script with realistic demo cases
2. **AML Dashboard** — Summary cards, priority queue, case aging, recent activity
3. **AML Case List** — Searchable, filterable, sortable case table
4. **Case Detail** — Case summary, customer profile, transactions, risk indicators, notes, decision, audit log
5. **Investigation Notes** — Typed, append-only notes with audit trail
6. **STR Decision Workflow** — Analyst recommendation, reviewer approval, filing status
7. **Audit Log** — Immutable event trail for all significant actions

---

## User Stories

---

### SEED-001 Define Prisma Schema and Seed Data

**As a** developer,  
**I want** a complete data model and realistic seed data,  
**So that** the application has a foundation to build features on.

#### Acceptance Criteria

- [ ] AC1: Given the Prisma schema, When I run migrations, Then tables are created for Customer, AmlCase, Transaction, InvestigationNote, StrDecision, and AuditLog
- [ ] AC2: Given the seed script, When I run `npx prisma db seed`, Then at least 5 customers and 6 AML cases are created with varied statuses (New, Under Review, Pending Information, Pending Reviewer Approval, Closed - No STR, Closed - STR Filed)
- [ ] AC3: Given seeded cases, When I query the database, Then each case has linked transactions, risk indicators, and at least one investigation note for active cases
- [ ] AC4: Given the seed data, When I query customers, Then customers include both corporate and individual types with different risk ratings (Low, Medium, High)
- [ ] AC5: Given the main demo case (AML-2026-0017), When I query it, Then it has customer "Meridian Star Trading Pte Ltd", risk score 82, alert type "Rapid Movement of Funds", and at least 4 linked transactions

#### Technical Notes

- Prisma models: Customer, AmlCase, Transaction, InvestigationNote, StrDecision, AuditLog
- Customer fields: id, name, type (Individual/Corporate), riskRating (Low/Medium/High), businessActivity, accountOpenDate, sourceOfWealth, nationality
- AmlCase fields: id, caseNumber, customerId, status, riskScore, alertType, alertReason, riskIndicators (JSON array), totalAmount, assignedAnalyst, createdAt, updatedAt
- Transaction fields: id, caseId, direction (Incoming/Outgoing), amount, currency, counterparty, country, date, purpose
- InvestigationNote fields: id, caseId, noteType, author, content, createdAt
- StrDecision fields: id, caseId, suspicionEstablished, suspicionReason, analystRecommendation, reviewerDecision, reviewerComment, filingStatus, filingReference, filedAt
- AuditLog fields: id, caseId, actor, action, details, timestamp
- Case statuses: New, Under Review, Pending Information, Pending Reviewer Approval, Approved for STR Filing, Closed - No STR, Closed - STR Filed
- Note types: Customer Profile Review, Transaction Review, Counterparty Review, Customer Outreach, Decision Rationale
- Filing statuses: Not Started, Drafting, Ready for Filing, Filed
- Seed customers: Meridian Star Trading, Lim Wei Hao, Eastern Horizon Imports, Asha Global Services, Tan Rui En
- Dependencies: None

---

### DASH-001 Display Dashboard Summary Cards

**As an** Operations Manager,  
**I want** to see summary metrics on the dashboard,  
**So that** I can quickly assess team workload and case urgency.

#### Acceptance Criteria

- [ ] AC1: Given the dashboard page, When it loads, Then summary cards display: Total Open Cases, High-Risk Cases, Pending Reviewer Approval, and Pending STR Filing counts
- [ ] AC2: Given seeded data, When the dashboard loads, Then the counts reflect accurate totals from the database
- [ ] AC3: Given a case with risk score ≥ 76, When counted, Then it appears in the High-Risk Cases card
- [ ] AC4: Given the dashboard, When it loads, Then it also displays average case age in days and oldest open case age

#### Technical Notes

- API: GET /api/dashboard/summary
- Aggregate queries on AmlCase table
- High-risk threshold: riskScore >= 76 (CRITICAL level)
- Dependencies: SEED-001

---

### DASH-002 Display Priority Case Queue

**As an** AML Analyst,  
**I want** to see my highest-priority cases on the dashboard,  
**So that** I can focus on the most urgent work first.

#### Acceptance Criteria

- [ ] AC1: Given the dashboard, When it loads, Then a priority case queue shows the top 5 cases sorted by risk score descending
- [ ] AC2: Given a priority case in the queue, When I click it, Then I navigate to the case detail page
- [ ] AC3: Given the queue, When it displays, Then each row shows case number, customer name, risk score, status, and case age in days

#### Technical Notes

- Part of dashboard page, uses same API or a dedicated endpoint
- Sort by riskScore DESC, limit 5
- Dependencies: SEED-001, DASH-001

---

### DASH-003 Display Recent Activity Feed

**As a** Compliance Reviewer,  
**I want** to see recent activity across all cases,  
**So that** I can monitor team progress and spot items needing attention.

#### Acceptance Criteria

- [ ] AC1: Given the dashboard, When it loads, Then a recent activity section shows the latest 10 audit log entries
- [ ] AC2: Given an audit log entry, When displayed, Then it shows timestamp, actor, action description, and related case number
- [ ] AC3: Given a recent activity entry with a case reference, When I click it, Then I navigate to the related case detail

#### Technical Notes

- API: GET /api/dashboard/activity (or included in summary endpoint)
- Query AuditLog ordered by timestamp DESC, limit 10
- Dependencies: SEED-001, DASH-001

---

### LIST-001 Display AML Case List

**As an** AML Analyst,  
**I want** to view all AML cases in a table,  
**So that** I can browse and select cases to work on.

#### Acceptance Criteria

- [ ] AC1: Given the case list page, When it loads, Then a table displays all cases with columns: Case Number, Customer Name, Customer Type, Risk Rating, Alert Type, Risk Score, Amount, Status, Assigned Analyst, Last Updated
- [ ] AC2: Given cases in the database, When the list loads, Then all seeded cases appear
- [ ] AC3: Given a case row, When I click it, Then I navigate to the case detail page

#### Technical Notes

- API: GET /api/cases
- Page route: /cases
- Dependencies: SEED-001

---

### LIST-002 Search and Filter Case List

**As an** AML Analyst,  
**I want** to search and filter the case list,  
**So that** I can quickly find specific cases.

#### Acceptance Criteria

- [ ] AC1: Given the case list, When I type in the search box, Then cases are filtered by case number or customer name (partial match)
- [ ] AC2: Given the case list, When I select a status filter, Then only cases with that status are shown
- [ ] AC3: Given the case list, When I select a risk rating filter, Then only cases with that customer risk rating are shown
- [ ] AC4: Given the case list, When I click a sort header (Risk Score or Last Updated), Then the list is sorted by that column
- [ ] AC5: Given no matching results, When filters are applied, Then an empty state message is shown

#### Technical Notes

- API supports query params: ?search=, ?status=, ?riskRating=, ?sortBy=, ?sortOrder=
- Client-side search with server-side filtering or full client-side for MVP
- Dependencies: LIST-001

---

### DETAIL-001 Display Case Summary and Customer Profile

**As an** AML Analyst,  
**I want** to see the case summary and customer profile on the case detail page,  
**So that** I can quickly understand the context of the investigation.

#### Acceptance Criteria

- [ ] AC1: Given a case ID in the URL, When the case detail page loads, Then it displays a header with case number, customer name, status badge, and risk score
- [ ] AC2: Given the case detail page, When it loads, Then a customer profile section shows: customer name, type, risk rating, business activity, account open date, source of wealth, and nationality
- [ ] AC3: Given the case detail page, When it loads, Then an alert summary section shows: alert type, alert reason, total amount, and date created
- [ ] AC4: Given an invalid case ID, When the page loads, Then a 404 error page is shown

#### Technical Notes

- API: GET /api/cases/[id]
- Page route: /cases/[id]
- Includes customer data via Prisma relation
- Dependencies: SEED-001

---

### DETAIL-002 Display Transaction Timeline

**As an** AML Analyst,  
**I want** to see a timeline of linked transactions,  
**So that** I can identify suspicious patterns in money flow.

#### Acceptance Criteria

- [ ] AC1: Given a case with linked transactions, When the case detail page loads, Then a transaction timeline section displays all linked transactions in chronological order
- [ ] AC2: Given a transaction in the timeline, When displayed, Then it shows: direction (Incoming/Outgoing), amount with currency, counterparty, country, date, and purpose
- [ ] AC3: Given transactions with different directions, When displayed, Then incoming and outgoing transactions are visually distinguished (e.g., different colors or badges)
- [ ] AC4: Given a case with no transactions, When displayed, Then an empty state message is shown

#### Technical Notes

- Transactions loaded as part of case detail API response (nested relation)
- Visual: vertical timeline or styled table with direction badges
- Dependencies: SEED-001, DETAIL-001

---

### DETAIL-003 Display Risk Indicators

**As an** AML Analyst,  
**I want** to see risk indicators for the case,  
**So that** I understand why the case was flagged and what to investigate.

#### Acceptance Criteria

- [ ] AC1: Given a case with risk indicators, When the detail page loads, Then all risk indicators are displayed as a list
- [ ] AC2: Given risk indicators, When displayed, Then each indicator is clearly labeled (e.g., "Rapid pass-through of funds", "High-risk jurisdiction counterparty")
- [ ] AC3: Given a case with no risk indicators, When displayed, Then an empty state is shown

#### Technical Notes

- Risk indicators stored as JSON array on AmlCase
- Rendered as a list of badges or alert items
- Dependencies: SEED-001, DETAIL-001

---

### NOTES-001 View Investigation Notes

**As an** AML Analyst,  
**I want** to view all investigation notes for a case,  
**So that** I can see the full investigation history.

#### Acceptance Criteria

- [ ] AC1: Given a case with investigation notes, When the detail page loads, Then notes are displayed in chronological order (oldest first)
- [ ] AC2: Given an investigation note, When displayed, Then it shows: note type, author, content, and creation timestamp
- [ ] AC3: Given a case with no notes, When displayed, Then an empty state with prompt to add the first note is shown

#### Technical Notes

- Notes loaded as part of case detail or separate endpoint
- Dependencies: SEED-001, DETAIL-001

---

### NOTES-002 Add Investigation Note

**As an** AML Analyst,  
**I want** to add an investigation note to a case,  
**So that** I can document my findings and build the investigation record.

#### Acceptance Criteria

- [ ] AC1: Given the case detail page, When I fill in note type, content, and click "Add Note", Then the note is saved and appears in the notes list
- [ ] AC2: Given an empty content field, When I try to submit, Then validation error is shown and note is not saved
- [ ] AC3: Given a missing note type, When I try to submit, Then validation error is shown
- [ ] AC4: Given a successful note creation, When it completes, Then an audit log entry is created with action "Note Added"
- [ ] AC5: Given a newly added note, When displayed, Then it shows the current user as author and the current timestamp

#### Technical Notes

- API: POST /api/cases/[id]/notes
- Request body: { noteType, content, author }
- Zod validation: noteType required (enum), content required (non-empty string)
- Creates AuditLog entry on success
- Dependencies: NOTES-001

---

### STR-001 Submit STR Recommendation

**As an** AML Analyst,  
**I want** to submit an STR recommendation with rationale,  
**So that** the compliance reviewer can assess whether to approve STR filing.

#### Acceptance Criteria

- [ ] AC1: Given a case with status "Under Review", When the analyst selects suspicion established (yes/no), provides rationale, and submits, Then the recommendation is saved
- [ ] AC2: Given suspicion established = yes, When submitted, Then case status changes to "Pending Reviewer Approval"
- [ ] AC3: Given suspicion established = no, When submitted, Then case status changes to "Closed - No STR"
- [ ] AC4: Given an empty rationale field, When the analyst tries to submit, Then validation error is shown
- [ ] AC5: Given a successful submission, When it completes, Then an audit log entry is created with action "Recommendation Submitted"
- [ ] AC6: Given a case not in "Under Review" or "Pending Information" status, When the analyst tries to submit a recommendation, Then the action is not available

#### Technical Notes

- API: POST /api/cases/[id]/decision
- Request body: { suspicionEstablished, suspicionReason, analystRecommendation }
- Updates case status and creates StrDecision record
- Zod validation: suspicionReason required, suspicionEstablished required (boolean)
- Dependencies: DETAIL-001, NOTES-001

---

### STR-002 Reviewer Approval Workflow

**As a** Compliance Reviewer,  
**I want** to approve or return an STR recommendation,  
**So that** the bank's STR filing decision is properly authorized.

#### Acceptance Criteria

- [ ] AC1: Given a case with status "Pending Reviewer Approval", When the reviewer clicks "Approve", Then case status changes to "Approved for STR Filing" and reviewer decision is recorded
- [ ] AC2: Given a case with status "Pending Reviewer Approval", When the reviewer clicks "Return for More Info" with a comment, Then case status changes to "Pending Information" and reviewer comment is saved
- [ ] AC3: Given a return action, When the reviewer does not provide a comment, Then validation error is shown
- [ ] AC4: Given an approval or return, When it completes, Then an audit log entry is created with action "Reviewer Decision"
- [ ] AC5: Given a case not in "Pending Reviewer Approval" status, When the reviewer tries to act, Then the action is not available
- [ ] AC6: Given the case detail as a reviewer, When viewing, Then the analyst's recommendation and rationale are prominently displayed near the decision panel

#### Technical Notes

- API: PATCH /api/cases/[id]/decision
- Request body: { reviewerDecision: "approved" | "returned", reviewerComment? }
- Updates StrDecision and case status
- Zod validation: reviewerComment required when decision = "returned"
- Dependencies: STR-001

---

### STR-003 Update Filing Status

**As a** Compliance Reviewer,  
**I want** to update the STR filing status after approval,  
**So that** the team can track the filing lifecycle.

#### Acceptance Criteria

- [ ] AC1: Given a case with status "Approved for STR Filing", When the reviewer updates filing status to "Drafting" or "Ready for Filing", Then the status is saved
- [ ] AC2: Given filing status updated to "Filed", When the reviewer submits, Then filing reference and filing date are required
- [ ] AC3: Given filing status "Filed" with valid reference, When saved, Then case status changes to "Closed - STR Filed"
- [ ] AC4: Given a missing filing reference when marking as Filed, When submitted, Then validation error is shown
- [ ] AC5: Given any filing status change, When it completes, Then an audit log entry is created with action "Filing Status Updated"

#### Technical Notes

- API: PATCH /api/cases/[id]/filing
- Request body: { filingStatus, filingReference?, filedAt? }
- Zod validation: filingReference and filedAt required when filingStatus = "Filed"
- Dependencies: STR-002

---

### AUDIT-001 Display Audit Log

**As a** Compliance Reviewer,  
**I want** to view the complete audit log for a case,  
**So that** I can verify the chain of actions and satisfy regulatory scrutiny.

#### Acceptance Criteria

- [ ] AC1: Given a case with audit log entries, When the case detail page loads, Then the audit log section displays all entries in reverse chronological order (newest first)
- [ ] AC2: Given an audit log entry, When displayed, Then it shows: timestamp, actor, action, and details
- [ ] AC3: Given the audit log, When the page loads, Then entries include case creation, note additions, status changes, and decision events
- [ ] AC4: Given a case with no audit log entries, When displayed, Then an empty state is shown (should not happen for valid cases)

#### Technical Notes

- Audit log entries are created by the system whenever state changes occur
- Displayed as part of case detail page (lower section)
- Dependencies: SEED-001, DETAIL-001

---

### ROLE-001 Role-Based Action Visibility

**As a** platform user,  
**I want** actions to be visible based on my role,  
**So that** I only see options relevant to my responsibilities.

#### Acceptance Criteria

- [ ] AC1: Given a role selector in the UI, When I select "Analyst", Then I can see "Add Note" and "Submit Recommendation" actions but not "Approve/Return" actions
- [ ] AC2: Given role "Reviewer", When I view a case in "Pending Reviewer Approval", Then I can see "Approve" and "Return" actions but not "Submit Recommendation"
- [ ] AC3: Given role "Operations Manager", When I view the dashboard, Then I see all summary metrics but cannot submit recommendations or approve decisions
- [ ] AC4: Given the role selector, When I switch roles, Then the available actions update immediately without page reload

#### Technical Notes

- Role selector component in app header/nav
- Roles stored in React context or zustand
- No real authentication — simulation only
- Role enum: Analyst, Reviewer, Operations Manager
- Dependencies: DETAIL-001, STR-001, STR-002

---

## Story Map

| Priority | Story ID | Title | Size (days) | Dependencies | Type |
|----------|----------|-------|-------------|--------------|------|
| P0 | SEED-001 | Define Prisma Schema and Seed Data | 3 | None | Backend |
| P0 | DASH-001 | Display Dashboard Summary Cards | 2 | SEED-001 | Full-stack |
| P0 | DASH-002 | Display Priority Case Queue | 1 | SEED-001, DASH-001 | Full-stack |
| P0 | DASH-003 | Display Recent Activity Feed | 1 | SEED-001, DASH-001 | Full-stack |
| P0 | LIST-001 | Display AML Case List | 2 | SEED-001 | Full-stack |
| P0 | LIST-002 | Search and Filter Case List | 2 | LIST-001 | Full-stack |
| P0 | DETAIL-001 | Display Case Summary and Customer Profile | 2 | SEED-001 | Full-stack |
| P0 | DETAIL-002 | Display Transaction Timeline | 2 | DETAIL-001 | Full-stack |
| P0 | DETAIL-003 | Display Risk Indicators | 1 | DETAIL-001 | Full-stack |
| P0 | NOTES-001 | View Investigation Notes | 1 | DETAIL-001 | Full-stack |
| P0 | NOTES-002 | Add Investigation Note | 2 | NOTES-001 | Full-stack |
| P0 | STR-001 | Submit STR Recommendation | 3 | DETAIL-001, NOTES-001 | Full-stack |
| P0 | STR-002 | Reviewer Approval Workflow | 2 | STR-001 | Full-stack |
| P0 | STR-003 | Update Filing Status | 2 | STR-002 | Full-stack |
| P0 | AUDIT-001 | Display Audit Log | 1 | SEED-001, DETAIL-001 | Full-stack |
| P1 | ROLE-001 | Role-Based Action Visibility | 2 | DETAIL-001, STR-001, STR-002 | Frontend |

---

## Dependency Graph

```
SEED-001
├── DASH-001
│   ├── DASH-002
│   └── DASH-003
├── LIST-001
│   └── LIST-002
├── DETAIL-001
│   ├── DETAIL-002
│   ├── DETAIL-003
│   ├── NOTES-001
│   │   └── NOTES-002
│   ├── STR-001
│   │   └── STR-002
│   │       └── STR-003
│   └── AUDIT-001
└── ROLE-001 (depends on DETAIL-001, STR-001, STR-002)
```

---

## Suggested Batch Order

| Batch | Stories | Rationale |
|-------|---------|-----------|
| 1 | SEED-001 | Foundation — schema and data must exist first |
| 2 | DASH-001, LIST-001, DETAIL-001 | Core navigation — dashboard, list, detail |
| 3 | DASH-002, DASH-003, LIST-002 | Dashboard completeness + list filtering |
| 4 | DETAIL-002, DETAIL-003, NOTES-001 | Case detail enrichment |
| 5 | NOTES-002, STR-001, AUDIT-001 | Investigation workflow |
| 6 | STR-002, STR-003, ROLE-001 | Decision workflow + role visibility |

---

## Out of Scope (Documented)

- Real transaction monitoring engine
- Real STRO / SONAR integration
- Real sanctions screening
- Real authentication / SSO
- Real document upload
- Production-grade workflow engine
- Full regulatory rule engine
