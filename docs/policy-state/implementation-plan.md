# AML Platform — Policy Implementation Plan
# FATF Feb 2026 + AMLO May 2026 + AMLO PEP Dec 2025

**Generated:** 2026-05-18  
**Triggered by:** Issue #11 — [policy-update] 7 new, 0 updated — 2026-05-18  
**Branch:** `policy/2026-05-18-amlo-policy-updates`

---

## Regulatory Context

| Item | Regulation | Effective |
|---|---|---|
| FATF High-Risk Jurisdictions (Feb 2026) | AMLA S.16 / FATF R.19 | 2026-02-16 |
| AMLO Designated Persons update (May 2026) | AMLA S.7 | 2026-05-08 |
| AMLO PEP Notification (Dec 2025) | AMLA S.16 / FATF R.12 | 2025-12-08 |

---

## User Stories

### HIGH PRIORITY

**Story 1 — FATF Jurisdiction EDD Flag**  
_As a compliance officer, I want the system to automatically flag transactions involving counterparties in FATF high-risk jurisdictions (grey/blacklist as of February 2026), so that I can apply Enhanced Due Diligence (EDD) as required by AMLA Section 16 and FATF Recommendation 19._

**Story 2 — Risk Indicator: FATF Jurisdiction**  
_As an AML analyst, I want the risk indicator list to automatically include a "FATF high-risk jurisdiction" indicator when any transaction counterparty is in a listed jurisdiction, so that risk scoring reflects the current regulatory environment._

### MEDIUM PRIORITY

**Story 3 — PEP Risk Indicator**  
_As a compliance officer, I want the system to surface a "Politically Exposed Person (PEP)" risk indicator when the customer's profile indicates PEP status, so that EDD obligations under the December 2025 AMLO PEP Notification are triggered._

**Story 4 — Sanctions / Designated Persons Check Utility**  
_As an MLRO, I want a utility function that validates whether a name appears on the AMLO Section 7 designated persons list, so that analysts are alerted when a case involves a sanctioned party._

---

## Implementation Plan (Prioritised)

### Sprint 1 — FATF Jurisdiction List + EDD Logic (HIGH)

| # | Task | File | Story |
|---|---|---|---|
| 1 | Create `lib/risk/fatf-jurisdictions.ts` with Feb 2026 Call for Action + Increased Monitoring lists | `lib/risk/fatf-jurisdictions.ts` | Story 1 |
| 2 | Create `lib/risk/edd-checks.ts` with `requiresEDD(country)` and `getFatfStatus(country)` | `lib/risk/edd-checks.ts` | Story 1 |
| 3 | Add Vitest tests for `requiresEDD` and `getFatfStatus` | `lib/risk/edd-checks.test.ts` | Story 1 |
| 4 | Create `lib/risk/risk-indicators.ts` with `getJurisdictionRiskIndicator` helper | `lib/risk/risk-indicators.ts` | Story 2 |
| 5 | Add Vitest tests for risk indicator derivation | `lib/risk/risk-indicators.test.ts` | Story 2 |

### Sprint 2 — PEP and Sanctions Utilities (MEDIUM)

| # | Task | File | Story |
|---|---|---|---|
| 6 | Add `isPepIndicator` helper to `lib/risk/risk-indicators.ts` | `lib/risk/risk-indicators.ts` | Story 3 |
| 7 | Add `lib/risk/sanctions.ts` stub with `checkDesignatedPersons` interface | `lib/risk/sanctions.ts` | Story 4 |
| 8 | Add Vitest tests for sanctions utility | `lib/risk/sanctions.test.ts` | Story 4 |

---

## Out of Scope (Requires Database Migration)

- Persisting EDD flag as a schema field on AmlCase
- Automated designation screening against live AMLO API (requires integration contract)
- Automated PEP database lookup (requires external PEP data provider)

These are flagged for the compliance team as follow-up items.
