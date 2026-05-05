
# AML/CFT Domain Knowledge

Reference for understanding the Anti-Money Laundering and Counter-Financing of Terrorism domain in the context of banking and financial services regulations.

---

## Terminology

| Term | Full Name | Description |
|------|-----------|-------------|
| AML | Anti-Money Laundering | Framework to detect and prevent money laundering |
| CFT | Countering the Financing of Terrorism | Framework to detect and prevent terrorism financing |
| STR | Suspicious Transaction Report | Report filed when suspicious activity is detected |
| FIU | Financial Intelligence Unit | National authority receiving and analysing STRs |
| MLRO | Money Laundering Reporting Officer | Senior officer responsible for STR filings |
| CDD | Customer Due Diligence | Process of verifying customer identity and risk |
| EDD | Enhanced Due Diligence | Additional scrutiny for higher-risk customers |
| KYC | Know Your Customer | Process of identifying and verifying customers |
| PEP | Politically Exposed Person | Individual with prominent public function |
| SAR | Suspicious Activity Report | Alternative term for STR used in some jurisdictions |
| TF | Terrorism Financing | Provision of funds for terrorist activities |
| UBO | Ultimate Beneficial Owner | Person who ultimately owns/controls an entity |
| FATF | Financial Action Task Force | International body setting AML/CFT standards |

---

## Regulatory Framework

AML/CFT regulations worldwide are guided by the **FATF Recommendations** — the international standards on combating money laundering and the financing of terrorism and proliferation. Each jurisdiction's financial regulator transposes these into binding local rules.

### Key Requirements

1. **Customer Due Diligence (CDD)**
   - Identify and verify customer identity before establishing business relationship
   - Identify beneficial owners (typically >25% ownership or control)
   - Understand purpose and intended nature of business relationship
   - Ongoing monitoring of transactions

2. **Enhanced Due Diligence (EDD)** triggers:
   - PEP customers (domestic and foreign)
   - High-risk countries (FATF grey/black list)
   - Complex or unusually large transactions
   - Unusual patterns without apparent economic purpose
   - Correspondent banking relationships

3. **Suspicious Transaction Reporting**
   - File STR with the FIU as soon as reasonably practicable
   - No tipping off the customer
   - Retain records for the period mandated by local regulation (commonly 5+ years)
   - Report even if transaction was not completed

4. **Record Keeping**
   - CDD records: retain for required period after termination of relationship
   - Transaction records: retain for required period after transaction
   - STR records: retain for required period after filing
   - Exact retention periods vary by jurisdiction (commonly 5–7 years)

5. **Internal Controls**
   - Designated MLRO
   - Training program for staff
   - Independent audit of AML/CFT program
   - Group-wide policies for branches/subsidiaries

---

## STR Workflow

The standard STR workflow in the platform:

```
1. DETECTION
   ├── Transaction monitoring alert
   ├── Staff referral
   ├── CDD review finding
   └── External information (media, law enforcement)

2. TRIAGE
   ├── Initial assessment by analyst
   ├── Assign risk level (LOW/MEDIUM/HIGH/CRITICAL)
   └── Decision: Investigate or Close (with reason)

3. INVESTIGATION
   ├── Gather transaction history
   ├── Review CDD/KYC records
   ├── Check sanctions lists
   ├── Analyze patterns and connections
   └── Document findings

4. ASSESSMENT
   ├── Risk assessment by analyst
   ├── Determine if suspicious
   ├── Escalate to MLRO if STR warranted
   └── Document rationale

5. MLRO REVIEW
   ├── MLRO reviews analyst's findings
   ├── Approve STR filing OR return for more info
   └── Final decision authority

6. STR FILING
   ├── Prepare STR in required format
   ├── MLRO approves final submission
   ├── Submit via electronic filing system
   └── Record filing reference number

7. CASE CLOSURE
   ├── Document outcome
   ├── Archive case with full audit trail
   └── Set retention period per local regulation
```

### Case Statuses

| Status | Description | Next Actions |
|--------|-------------|--------------|
| `OPEN` | Newly created, pending triage | Assign, Triage |
| `UNDER_REVIEW` | Analyst investigating | Investigate, Assess |
| `ESCALATED` | Sent to MLRO for review | MLRO Review, Return |
| `STR_FILED` | STR submitted to FIU | Monitor, Close |
| `CLOSED_NO_STR` | Closed without filing | Archive |
| `CLOSED_STR_FILED` | Closed after STR filed | Archive |

### Risk Levels

| Level | Score Range | Characteristics |
|-------|-------------|-----------------|
| LOW | 0-25 | Minor anomaly, likely explainable |
| MEDIUM | 26-50 | Unusual pattern, warrants investigation |
| HIGH | 51-75 | Multiple indicators, likely suspicious |
| CRITICAL | 76-100 | Clear ML/TF indicators, urgent STR |

---

## Suspicion Indicators

Common indicators that may trigger investigation:

### Transaction-Based
- Transactions just below reporting thresholds (structuring)
- Rapid movement of funds (layering)
- Transactions inconsistent with customer profile
- Large cash transactions without business justification
- Round-amount transfers to high-risk jurisdictions

### Customer-Based
- Reluctance to provide identification
- Use of nominees/shell companies
- Frequent changes in account details
- PEP status (current or former)
- Adverse media mentions

### Geographic
- Transactions involving FATF grey/black list countries
- Unusual correspondent banking patterns
- Jurisdictions with weak AML controls

---

## Domain Model

### Bounded Contexts

```
┌─────────────────────┐  ┌─────────────────────────┐
│  Case Management    │  │  Customer Due Diligence  │
│                     │  │                          │
│  - AML Cases        │  │  - Customer Profiles     │
│  - Investigations   │  │  - KYC Records           │
│  - Risk Assessments │  │  - EDD Reviews           │
│  - Case Assignment  │  │  - Document Verification │
└────────┬────────────┘  └──────────┬──────────────┘
         │                          │
         │     ┌────────────────┐   │
         └────►│  Transaction   │◄──┘
               │  Monitoring    │
               │                │
               │  - Alerts      │
               │  - Rules       │
               │  - Patterns    │
               └───────┬────────┘
                       │
               ┌───────▼────────┐
               │  STR Filing    │
               │                │
               │  - STR Drafts  │
               │  - FIU Submit  │
               │  - Amendments  │
               └────────────────┘
```

### Key Entities

**AmlCase** — the primary aggregate. All state changes to an investigation go through the case.
- Identity: unique ID + human-readable case number (e.g., `CASE-2024-001`)
- State: status, risk level, priority
- Ownership: assigned analyst, team, role (ANALYST or MLRO)
- Children: investigation record, risk assessments (append-only), STR filing (optional)
- Metadata: created/updated/closed timestamps, retention expiry

**Investigation** — findings narrative, reviewed transactions, attached documents, event timeline.

**RiskAssessment** — score (0–100), level, contributing factors, rationale, assessed by/at. Append-only for auditability.

**StrFiling** — filing status, reference number, filed by/at, acknowledged at, filing content.

### Business Rules (Invariants)

- Cannot escalate a CLOSED case
- Cannot file STR for LOW risk case without MLRO override
- Status transitions follow the defined state machine (see Case Statuses above)
- Only MLRO can approve STR filing
- Risk assessments are append-only (historical record preserved)

### Value Object Concepts

- **Risk Score** — integer 0–100, immutable; maps to risk level (LOW ≤25, MEDIUM ≤50, HIGH ≤75, CRITICAL ≤100)
- **Money Amount** — integer minor units (cents) + ISO 4217 currency code; avoids floating-point
- **Suspicion Indicator** — category (transaction/customer/geographic/behavioral), code, severity, detection timestamp
- **Sanctions Match** — confidence score, list name (UN, OFAC, EU, etc.), match type (exact/fuzzy/alias)

### Domain Events

Significant state changes are captured as events for audit trail, cross-context communication, and notifications:

| Event | Key Data |
|-------|----------|
| Case Created | customer, initial risk level, source (alert/referral/CDD review/external) |
| Risk Assessed | previous and new score/level, contributing factors |
| Case Escalated | from/to role, reason, priority |
| STR Filed | filing reference, filed by, approved by |
| Case Closed | resolution (STR filed / no suspicious activity / insufficient evidence), retention expiry |

---

## Realistic Data Patterns

### Case Numbers
Format: `CASE-{YYYY}-{NNN}` (e.g., `CASE-2024-001`)

### Transaction Amounts
- Typical retail: 100 — 50,000 (local currency)
- Threshold for enhanced monitoring: varies by jurisdiction (e.g., 10,000–20,000 single / 50,000–100,000 cumulative monthly)
- Cash transaction report threshold: commonly 10,000–15,000 (local currency equivalent)
- Structured amounts: just below thresholds (e.g., 9,800, 9,500 when threshold is 10,000)

### Customer Types
- Individual (retail banking)
- Corporate (SME, large corporate)
- Correspondent bank
- Trust / Foundation
- PEP (domestic or foreign)

### High-Risk Jurisdictions (Example)
- FATF Grey List countries (updated periodically)
- Countries with known ML/TF activity
- Tax haven jurisdictions without adequate AML controls
- Conflict zones

### Timeline Expectations
- Alert to triage: within 24 hours
- Investigation: 5-15 business days
- STR filing: as soon as reasonably practicable (typically within 15 days)
- Case closure: within 30 days of STR filing or decision not to file
- Record retention: per local regulation (commonly 5+ years)
