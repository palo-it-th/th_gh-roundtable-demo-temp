
# AML/CFT Domain Knowledge — Thailand

Reference for understanding the Anti-Money Laundering and Counter-Financing of Terrorism domain in the context of Thai banking and financial services regulations.

---

## Terminology

| Term | Full Name | Description |
|------|-----------|-------------|
| AML | Anti-Money Laundering | Framework to detect and prevent money laundering |
| CFT | Countering the Financing of Terrorism | Framework to detect and prevent terrorism financing |
| AMLO | Anti-Money Laundering Office (สำนักงานป้องกันและปราบปรามการฟอกเงิน) | Thailand's Financial Intelligence Unit (FIU) |
| BOT | Bank of Thailand (ธนาคารแห่งประเทศไทย) | Central bank responsible for supervising financial institutions |
| AMLA | Anti-Money Laundering Act B.E. 2542 (1999) | Primary AML legislation in Thailand |
| FST | Suppression of the Financing of Terrorism Act | Complementary law addressing terrorism financing |
| STR | Suspicious Transaction Report | Report filed to AMLO when suspicious activity is detected |
| CTR | Cash Transaction Report | Mandatory report for cash transactions of THB 2,000,000 or more |
| FIU | Financial Intelligence Unit | AMLO serves as Thailand's FIU |
| CDD | Customer Due Diligence | Process of verifying customer identity and risk |
| EDD | Enhanced Due Diligence | Additional scrutiny for higher-risk customers |
| KYC | Know Your Customer | Process of identifying and verifying customers |
| PEP | Politically Exposed Person | Individual with prominent public function |
| TF | Terrorism Financing | Provision of funds for terrorist activities |
| UBO | Ultimate Beneficial Owner | Person who ultimately owns or controls an entity |
| FATF | Financial Action Task Force | International body setting AML/CFT standards |
| NACC | National Anti-Corruption Commission | Thai agency relevant to PEP identification |

---

## Regulatory Framework

Thailand's AML/CFT regime is guided by the **FATF Recommendations** and implemented through national legislation. The **Anti-Money Laundering Office (AMLO)** serves as the Financial Intelligence Unit, while the **Bank of Thailand (BOT)** supervises financial institutions for compliance.

### Primary Legislation

| Law | Purpose |
|-----|---------|
| Anti-Money Laundering Act B.E. 2542 (1999) and amendments | Core AML legislation — predicate offences, reporting obligations, asset forfeiture |
| Suppression of the Financing of Terrorism Act (FST) | Counter-terrorism financing obligations |
| Ministerial Regulation on Customer Due Diligence B.E. 2563 (2020) | CDD procedures and requirements |
| Ministerial Regulation on KYC B.E. 2562 (2019) | Customer identification and verification standards |
| Ministerial Regulation No. 4 B.E. 2543 (2000) | Transaction reporting requirements |

### Key Requirements

1. **Customer Due Diligence (CDD)**
   - Identify and verify customer identity before establishing a business relationship
   - Identify beneficial owners (persons with ultimate ownership or control)
   - Understand the purpose and intended nature of the business relationship
   - Conduct ongoing monitoring of transactions
   - KYC required for e-money transfers of THB 50,000 or more
   - KYC required for occasional transactions of THB 100,000 cumulative or more

2. **Enhanced Due Diligence (EDD)** triggers:
   - PEP customers (domestic and foreign)
   - FATF grey/black list countries
   - Myanmar transactions (per BOT/AMLO joint advisory, June 2024)
   - Complex or unusually large transactions
   - Unusual patterns without apparent economic purpose
   - Correspondent banking relationships
   - Customers from Mekong corridor countries with elevated risk indicators

3. **Transaction Reporting**
   - **Cash Transaction Report (CTR):** Mandatory for cash transactions of THB 2,000,000 or more
   - **Property transactions:** Report transactions of THB 5,000,000 or more
   - **STR filing:** Within 7 days of suspicion arising
   - Report to AMLO
   - No tipping off the customer
   - Report even if the transaction was not completed

4. **Record Keeping**
   - **Retention period: 10 years** from account closure or transaction date
   - CDD records: retain for 10 years after termination of relationship
   - Transaction records: retain for 10 years after transaction
   - STR records: retain for 10 years after filing

5. **Internal Controls**
   - Designated compliance officer responsible for AML/CFT program
   - Training program for staff
   - Independent audit of AML/CFT program
   - Group-wide policies for branches and subsidiaries
   - Regular updates based on AMLO typology reports

### Key Thresholds (THB)

| Threshold | Amount | Obligation |
|-----------|--------|------------|
| Cash Transaction Report | THB 2,000,000 or more | Mandatory CTR filing to AMLO |
| Property transactions | THB 5,000,000 or more | Mandatory reporting |
| E-money transfer KYC | THB 50,000 or more | Full KYC required |
| Occasional transaction KYC | THB 100,000 cumulative | Full KYC required |

### Penalties

| Violation | Penalty |
|-----------|---------|
| Failure to report (CTR/STR) | Fine up to THB 1,000,000 + THB 10,000 per day of continuing violation |
| False reporting | Imprisonment up to 2 years or fine THB 50,000–500,000, or both |
| Failure to conduct CDD | Administrative sanctions, potential licence restrictions |
| Tipping off | Criminal liability under AMLA |

---

## STR Workflow

The standard STR workflow in the platform (Thailand-specific):

```
1. DETECTION
   ├── Transaction monitoring alert
   ├── Staff referral
   ├── CDD review finding
   ├── External information (media, AMLO advisories, law enforcement)
   └── CTR pattern analysis (structuring detection)

2. TRIAGE
   ├── Initial assessment by analyst
   ├── Assign risk level (LOW/MEDIUM/HIGH/CRITICAL)
   └── Decision: Investigate or Close (with documented reason)

3. INVESTIGATION
   ├── Gather transaction history
   ├── Review CDD/KYC records
   ├── Check sanctions lists (UN, AMLO designated list, BOT circulars)
   ├── Check PEP databases (NACC, foreign PEP lists)
   ├── Analyze patterns and connections
   └── Document findings

4. ASSESSMENT
   ├── Risk assessment by analyst
   ├── Determine if suspicious
   ├── Escalate to compliance officer if STR warranted
   └── Document rationale

5. COMPLIANCE OFFICER REVIEW
   ├── Reviews analyst's findings
   ├── Approve STR filing OR return for more information
   └── Final decision authority

6. STR FILING TO AMLO
   ├── Prepare STR in AMLO-prescribed format
   ├── Compliance officer approves final submission
   ├── Submit to AMLO within 7 days of suspicion arising
   ├── Record filing reference number
   └── No tipping off at any stage

7. CASE CLOSURE
   ├── Document outcome
   ├── Archive case with full audit trail
   └── Set retention period (10 years)
```

### Case Statuses

| Status | Description | Next Actions |
|--------|-------------|--------------|
| `OPEN` | Newly created, pending triage | Assign, Triage |
| `UNDER_REVIEW` | Analyst investigating | Investigate, Assess |
| `ESCALATED` | Sent to compliance officer for review | Review, Return |
| `STR_FILED` | STR submitted to AMLO | Monitor, Close |
| `CLOSED_NO_STR` | Closed without filing | Archive |
| `CLOSED_STR_FILED` | Closed after STR filed | Archive |

### Risk Levels

| Level | Score Range | Characteristics |
|-------|-------------|-----------------|
| LOW | 0-25 | Minor anomaly, likely explainable |
| MEDIUM | 26-50 | Unusual pattern, warrants investigation |
| HIGH | 51-75 | Multiple indicators, likely suspicious |
| CRITICAL | 76-100 | Clear ML/TF indicators, urgent STR (file within 7 days) |

---

## Suspicion Indicators

Common indicators that may trigger investigation under Thai AML/CFT regulations:

### Transaction-Based
- Cash transactions structured just below THB 2,000,000 (structuring/smurfing)
- Rapid movement of funds through multiple accounts (layering)
- Transactions inconsistent with customer profile or declared income
- Large cash deposits without legitimate business justification
- Round-amount transfers to high-risk jurisdictions (Myanmar, Mekong corridor)
- Frequent cross-border transfers via informal value transfer systems
- Multiple property transactions just below THB 5,000,000 threshold
- Unusual patterns in e-money or mobile banking transactions

### Customer-Based
- Reluctance to provide identification documents
- Use of nominees, shell companies, or complex ownership structures
- Frequent changes in account details or authorized signatories
- PEP status (current or former government officials, military, judiciary)
- Adverse media mentions (corruption, organized crime, drug trafficking)
- Customers linked to predicate offences under AMLA (narcotics, fraud, public corruption, illegal gambling, human trafficking)
- Inconsistency between declared source of funds and actual transaction patterns

### Geographic
- Transactions involving Myanmar (BOT/AMLO joint advisory, June 2024)
- Transactions involving FATF grey/black list countries
- Cross-border flows through Mekong corridor (Laos, Cambodia, Myanmar)
- Transactions with Vanuatu or other FATF-identified jurisdictions
- Unusual patterns involving border provinces (Tak, Chiang Rai, Nong Khai, Mukdahan)
- Jurisdictions with weak AML controls or known for shell company formation

---

## High-Risk Jurisdictions for Thailand

| Jurisdiction | Risk Level | Basis |
|--------------|------------|-------|
| Myanmar | Very High | BOT/AMLO joint advisory (June 2024), conflict zone, weak controls |
| Laos | High | Mekong corridor, casino-related flows, limited AML capacity |
| Cambodia | High | Mekong corridor, casino sector, FATF mutual evaluation concerns |
| Vanuatu | High | FATF grey list |
| Other FATF grey list | High | Updated periodically per FATF plenary |
| FATF black list (Iran, DPRK) | Very High | Comprehensive counter-measures required |

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
               │  - CTR Detect  │
               └───────┬────────┘
                       │
               ┌───────▼────────┐
               │  STR Filing    │
               │  (to AMLO)     │
               │                │
               │  - STR Drafts  │
               │  - AMLO Submit │
               │  - CTR Filing  │
               │  - Amendments  │
               └────────────────┘
```

### Key Entities

**AmlCase** — the primary aggregate. All state changes to an investigation go through the case.
- Identity: unique ID + human-readable case number (e.g., `CASE-2025-001`)
- State: status, risk level, priority
- Ownership: assigned analyst, team, role (ANALYST or COMPLIANCE_OFFICER)
- Children: investigation record, risk assessments (append-only), STR filing (optional), CTR filing (if applicable)
- Metadata: created/updated/closed timestamps, retention expiry (10 years)

**Investigation** — findings narrative, reviewed transactions, attached documents, event timeline.

**RiskAssessment** — score (0-100), level, contributing factors, rationale, assessed by/at. Append-only for auditability.

**StrFiling** — filing status, AMLO reference number, filed by/at, acknowledged at, filing content, 7-day deadline tracking.

**CtrFiling** — cash transaction report for amounts of THB 2,000,000 or more, filing status, AMLO reference.

### Business Rules (Invariants)

- Cannot escalate a CLOSED case
- Cannot file STR for LOW risk case without compliance officer override
- STR must be filed within 7 days of suspicion arising
- Status transitions follow the defined state machine (see Case Statuses above)
- Only compliance officer can approve STR filing
- Risk assessments are append-only (historical record preserved)
- CTR is mandatory for cash transactions of THB 2,000,000 or more (no discretion)
- Records must be retained for 10 years from closure or transaction date
- No tipping off at any stage of the process

### Value Object Concepts

- **Risk Score** — integer 0-100, immutable; maps to risk level (LOW <=25, MEDIUM <=50, HIGH <=75, CRITICAL <=100)
- **Money Amount** — integer minor units (satang) + THB currency code; avoids floating-point
- **Suspicion Indicator** — category (transaction/customer/geographic/behavioral), code, severity, detection timestamp
- **Sanctions Match** — confidence score, list name (UN, AMLO designated, BOT circular), match type (exact/fuzzy/alias)
- **Filing Deadline** — 7 days from suspicion arising for STR; tracks compliance with AMLA timeline

### Domain Events

Significant state changes are captured as events for audit trail, cross-context communication, and notifications:

| Event | Key Data |
|-------|----------|
| Case Created | customer, initial risk level, source (alert/referral/CDD review/external/CTR pattern) |
| Risk Assessed | previous and new score/level, contributing factors |
| Case Escalated | from/to role, reason, priority |
| STR Filed | AMLO filing reference, filed by, approved by, days from suspicion |
| CTR Filed | AMLO reference, transaction amount, transaction date |
| Case Closed | resolution (STR filed / no suspicious activity / insufficient evidence), retention expiry (10 years) |
| Filing Deadline Warning | days remaining, case reference, escalation trigger |

---

## Realistic Data Patterns

### Case Numbers
Format: `CASE-{YYYY}-{NNN}` (e.g., `CASE-2025-001`)

### Transaction Amounts (THB)
- Typical retail: THB 1,000 - THB 500,000
- Cash Transaction Report threshold: THB 2,000,000
- Property transaction reporting threshold: THB 5,000,000
- E-money KYC threshold: THB 50,000
- Occasional transaction KYC threshold: THB 100,000 cumulative
- Structured amounts (structuring indicators): just below THB 2,000,000 (e.g., THB 1,950,000, THB 1,900,000)

### Customer Types
- Individual (retail banking)
- Corporate (SME, large corporate)
- Correspondent bank
- Trust / Foundation
- PEP (domestic — government, military, judiciary, SOE executives)
- Foreign PEP
- Money service business / exchange operator
- Cooperative / microfinance institution

### High-Risk Customer Profiles (Thailand-Specific)
- Cross-border traders operating in border provinces (Tak, Chiang Rai, Nong Khai, Mukdahan)
- Casino-related businesses (Mekong corridor proximity)
- Precious metals and gems dealers
- Real estate developers with cash-intensive operations
- Underground lottery operators
- Customers with Myanmar, Laos, or Cambodia nexus

### Timeline Expectations (Thailand-Specific)
- Alert to triage: within 24 hours
- Investigation: 5-15 business days
- **STR filing: within 7 days of suspicion arising** (AMLA requirement)
- CTR filing: within prescribed period of transaction
- Case closure: within 30 days of STR filing or decision not to file
- **Record retention: 10 years** from account closure or transaction date

### Predicate Offences Under AMLA

The following predicate offences under the Anti-Money Laundering Act trigger reporting obligations:

- Narcotics offences
- Public fraud
- Malfeasance in office / corruption
- Embezzlement or fraud against financial institutions
- Customs evasion
- Terrorism and terrorism financing
- Illegal gambling
- Human trafficking
- Sexual exploitation
- Arms trafficking
- Extortion / kidnapping for ransom
- Intellectual property offences
- Environmental crimes (illegal logging, wildlife trafficking)
- Tax evasion (added by amendment)
