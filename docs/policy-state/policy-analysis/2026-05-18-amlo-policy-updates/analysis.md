# Policy Analysis — AMLO/FATF Updates (2026-05-18)

**Analysis date:** 2026-05-18  
**Analyst:** Policy Analysis Orchestrator  
**Issue:** #11 — [policy-update] 7 new, 0 updated — 2026-05-18

---

## 1. Regulatory Action Summary

Three regulatory developments require codebase attention, in priority order:

### 1.1 FATF High-Risk Jurisdictions — February 2026 Update (HIGH PRIORITY)

- **Source:** AMLO announcement, 16 February 2026
- **Regulation:** FATF Recommendations (R.10, R.12, R.19); AMLA B.E. 2542 Section 16 (EDD obligations)
- **Change:** FATF updated both the Call for Action list (blacklist) and the Increased Monitoring list (grey list) at its February 2026 plenary. AMLO Thailand has adopted these lists.
- **Impact:** Banks must apply **Enhanced Due Diligence (EDD)** for all transactions with counterparties in listed jurisdictions. Risk scores for cases involving these jurisdictions must be elevated.
- **Effective date:** Immediate upon AMLO publication (16 February 2026); supersedes Oct 2025 and Jun 2025 versions.

### 1.2 AMLO Designated Persons List — Updated 8 May 2026 (HIGH PRIORITY)

- **Source:** AMLO announcement, 14 May 2026
- **Regulation:** AMLA B.E. 2542 Section 7 (designated persons / targeted financial sanctions)
- **Change:** The Section 7 designated persons list was updated on 8 May 2026. Banks must screen customers and counterparties against this list and freeze assets / report to AMLO for any matches.
- **Impact:** Sanctions screening workflow must reference the current list. Any case involving a designated person requires immediate escalation.
- **Effective date:** 8 May 2026.

### 1.3 AMLO PEP Notification — December 2025 (MEDIUM PRIORITY)

- **Source:** AMLO Notification on PEPs, 08 December 2025
- **Regulation:** AMLA B.E. 2542; aligns with FATF Recommendation 12
- **Change:** New/updated AMLO notification defining PEP categories, EDD obligations for domestic and foreign PEPs, source-of-wealth verification, and ongoing monitoring requirements.
- **Impact:** Case management must surface PEP status as a risk indicator; EDD workflow must be triggered for PEP-related cases.
- **Effective date:** 08 December 2025 (already in effect).

---

## 2. Sections of Regulation Affected

| Regulation | Section | Topic |
|---|---|---|
| AMLA B.E. 2542 | Section 7 | Designated persons / targeted financial sanctions |
| AMLA B.E. 2542 | Section 16 | EDD obligations for high-risk customers |
| AMLA B.E. 2542 | Section 35 | Transaction Committee powers (enforcement context) |
| FATF Recommendations | R.10 | Customer due diligence |
| FATF Recommendations | R.12 | PEPs |
| FATF Recommendations | R.19 | Higher-risk countries (EDD for FATF grey/blacklist) |
| AMLO PEP Notification (Dec 2025) | All | PEP identification, EDD, source-of-wealth |

---

## 3. Previous State Comparison

No previous committed analysis exists in `docs/policy-state/policy-analysis/`. This is the first run.

---

## 4. Effective Dates / Compliance Deadlines

| Item | Effective Date |
|---|---|
| FATF Feb 2026 jurisdictions | 16 February 2026 (immediate) |
| AMLO Section 7 designated persons | 8 May 2026 (immediate) |
| AMLO PEP Notification | 8 December 2025 (already in effect) |

---

## 5. Codebase Impact Assessment

The current codebase (`lib/`, `app/api/`) has no:
- FATF jurisdiction list or EDD flag logic
- Designated persons / sanctions screening
- PEP identification or EDD workflow trigger

All three gaps require new code in `lib/risk/`.
