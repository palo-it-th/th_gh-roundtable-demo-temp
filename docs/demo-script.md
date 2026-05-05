# Demo Walkthrough — AML Case Management Platform

A 5–10 minute guided walkthrough for stakeholders demonstrating the full AML investigation lifecycle.

## Setup

- Application running: `npm run dev`
- Database seeded with demo data: `npx prisma db seed`
- Browser open to [http://localhost:3000](http://localhost:3000)
- Role selector set to **Analyst** (default)

---

## Script

### Scene 1: Dashboard Overview (1 min)

**Show:** Dashboard page at `/`

**Say:** "This is the operational command center for the compliance team. At a glance, managers can see team workload and identify where attention is needed."

**Point out:**
- **4 summary cards** — Total Open Cases, High-Risk Cases, Pending Reviewer Approval, and Pending STR Filing. Each card shows a live count from the database.
- **Priority case queue** — the top 5 highest-risk cases sorted by risk score. Eastern Horizon (91) and Meridian Star (82) are at the top.
- **Recent activity feed** — the latest audit log entries showing who did what and when, across all cases.

---

### Scene 2: Case List (1 min)

**Show:** Navigate to `/cases`

**Say:** "Analysts start their day here. Every AML alert that needs investigation appears in this table with key context — risk score, status, customer, and alert type."

**Demo:**
1. Type **"Meridian"** in the search bar → table filters to show only Meridian Star cases
2. Clear search, then select **"Pending Reviewer Approval"** from the status filter → only Eastern Horizon's case appears
3. Click the **Risk Score** column header to sort by risk score descending
4. Point out the color-coded **status badges** and **risk score badges** (red for critical, amber for high)

---

### Scene 3: Case Investigation (2 min)

**Show:** Click into case **AML-2026-0017** (Meridian Star Trading)

**Say:** "This is our primary investigation workspace. Everything the analyst needs is on one page — customer profile, transactions, risk indicators, and investigation history."

**Point out:**
- **Case header** — case number, status badge (Under Review), risk score (82), assigned analyst (Sarah Chen)
- **Customer profile panel** — Meridian Star Trading Pte Ltd, Corporate, Medium risk rating, electronics distributor
- **Alert summary** — "Rapid Movement of Funds" with the full alert reason describing suspicious patterns
- **Transaction timeline** — 4 transactions totalling $480,000 showing the rapid pass-through pattern: BVI → Panama, Myanmar → Cayman Islands, all within 4 days
- **Risk indicators** — 4 red flags: rapid pass-through, unrelated counterparties, high-risk jurisdictions, inconsistent with business activity
- **Investigation notes** — 3 notes by Sarah Chen documenting her analysis (Customer Profile Review, Transaction Review, Counterparty Review)

**Demo:** Scroll to the notes section and add a new note:
1. Select note type: **"Decision Rationale"**
2. Enter content: "Based on review of all evidence, the rapid pass-through pattern and shell company indicators establish grounds for suspicion."
3. Click **Add Note**
4. Point out the note appears immediately and the audit log records the action

---

### Scene 4: STR Decision — Analyst Recommendation (2 min)

**Show:** STR Decision panel on the same case detail page

**Say:** "Once the analyst completes their investigation, they document their findings and formally recommend whether to file an STR. This creates an auditable record of the decision rationale."

**Demo:**
1. In the decision form, select **"Yes"** for suspicion established
2. Enter suspicion reason: "Rapid movement of funds through shell entities in high-risk jurisdictions inconsistent with declared electronics distribution business."
3. Enter analyst recommendation: "Recommend STR filing with STRO via SONAR based on suspected layering through BVI, Panama, Myanmar, and Cayman Islands entities."
4. Click **Submit Recommendation**
5. Point out the case status changes to **"Pending Reviewer Approval"** — the workflow moves forward

---

### Scene 5: Reviewer Approval (2 min)

**Show:** Switch role to **Reviewer** using the role selector in the sidebar

**Say:** "The compliance reviewer now sees the analyst's work and must independently assess whether the STR filing should proceed. This two-person review is a regulatory requirement."

**Demo:**
1. Navigate to case **AML-2026-0021** (Eastern Horizon Imports) — this one is already pending approval
2. Point out the **analyst recommendation summary** panel showing Sarah Chen's assessment
3. The reviewer sees the full case context: transactions to Myanmar, Cambodia, Vanuatu, and Laos; shell company indicators; missing documentation
4. Enter reviewer comment: "Concur with analyst assessment. Shell entity involvement and FATF grey-list jurisdictions warrant filing."
5. Click **Approve for STR Filing**
6. Point out the case status changes to **"Approved for STR Filing"**

---

### Scene 6: Filing Status Tracking (1 min)

**Show:** Filing status form (visible after approval)

**Say:** "Once approved, the filing lifecycle is tracked through to submission. This creates a complete chain of custody for regulatory examination."

**Demo:**
1. Update filing status to **"Drafting"** → status updates
2. Update to **"Ready for Filing"** → status updates
3. Update to **"Filed"** — enter reference number: `STR-2026-SG-005201` and filing date
4. Click **Update Filing Status**
5. Point out the case status changes to **"Closed — STR Filed"**

**Say:** "The entire journey — from alert to filing — is captured with timestamps and actors."

---

### Scene 7: Audit Trail (30 sec)

**Show:** Scroll to the audit log section on any case

**Say:** "Every action is recorded in an immutable audit log — case creation, status changes, notes added, decisions submitted, filing updates. This is critical for regulatory examination and internal compliance reviews."

**Point out:**
- Each entry shows **timestamp**, **actor**, **action**, and **details**
- The log is append-only — entries cannot be edited or deleted
- Operations Managers can review the full trail across all cases

---

### Scene 8: Closed Cases (30 sec)

**Show:** Navigate back to `/cases`, filter by status **"Closed — No STR"**

**Say:** "Not every alert leads to a filing. Case AML-2026-0012 was a false positive — the analyst verified the transaction spike was a legitimate bonus and CPF withdrawal. The investigation is documented, but no STR was needed."

**Point out:** Lim Wei Hao's case (risk score 28) — closed with full documentation but no filing.

---

## Key Metrics

| Metric | Value |
|--------|-------|
| User stories delivered | 16 of 16 |
| Unit tests | 59 passing |
| Acceptance criteria | 60 verified |
| API routes | 7 endpoints (10 including method variants) |
| Database models | 6 (Customer, AmlCase, Transaction, InvestigationNote, StrDecision, AuditLog) |
| Demo customers | 5 (3 corporate, 2 individual) |
| Demo cases | 6 (spanning all lifecycle statuses) |
| Full workflow | Alert → Investigation → Decision → Approval → Filing → Closed |
