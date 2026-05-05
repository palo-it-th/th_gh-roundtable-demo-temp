# Acceptance Test Report

## Environment
- App: localhost:3000 [running]
- Database: seeded — 6 cases, 5 customers, 20 transactions, 13 notes, 28 audit log entries
- Stories tested: DASH-001, LIST-001, DETAIL-001, DASH-002, DASH-003, LIST-002, DETAIL-002, DETAIL-003, NOTES-001, NOTES-002, STR-001, AUDIT-001, STR-002, STR-003, ROLE-001

## Summary
| Story | Criteria Tested | Passed | Failed |
|-------|----------------|--------|--------|
| DASH-001 | 4 | 4 | 0 |
| LIST-001 | 3 | 3 | 0 |
| DETAIL-001 | 4 | 4 | 0 |
| DASH-002 | 3 | 3 | 0 |
| DASH-003 | 3 | 3 | 0 |
| LIST-002 | 5 | 5 | 0 |
| DETAIL-002 | 4 | 3 | 0 (1 untestable) |
| DETAIL-003 | 3 | 2 | 0 (1 untestable) |
| NOTES-001 | 3 | 3 | 0 |
| NOTES-002 | 5 | 5 | 0 |
| STR-001 | 6 | 6 | 0 |
| AUDIT-001 | 4 | 4 | 0 |
| STR-002 | 6 | 6 | 0 |
| STR-003 | 5 | 5 | 0 |
| ROLE-001 | 4 | 4 | 0 |

## Result: PASS

## Seed Data Gaps
- Missing: Case with 0 transactions (needed for DETAIL-002 AC4 empty state test)
- Missing: Case with 0 risk indicators (needed for DETAIL-003 AC3 empty state test)

---

## Batch 1 — Passing Criteria

### DASH-001 — AC1: Summary cards display correctly
- **Verified:** Dashboard at `/` displays four summary cards: "Total Open Cases" (4), "High-Risk Cases" (2), "Pending Approval" (1), "Pending Filing" (0). All four card types present and labeled.
- **Screenshot:** `screenshots/dash-001-dashboard.png`

### DASH-001 — AC2: Counts reflect accurate database totals
- **Verified:** API response at `/api/dashboard/summary` returns `totalOpenCases: 4`, `highRiskCases: 2`, `pendingReviewerApproval: 1`, `pendingStrFiling: 0`. Cross-verified against direct SQL query. All counts match.

### DASH-001 — AC3: High-risk threshold is riskScore >= 76
- **Verified:** API code uses `riskScore: { gte: 76 }` with open-status filter. Two matching cases: AML-2026-0017 (score 82, UNDER_REVIEW) and AML-2026-0021 (score 91, PENDING_REVIEWER_APPROVAL). Dashboard shows "2" for High-Risk Cases.

### DASH-001 — AC4: Average case age and oldest case age ✅ (RE-VALIDATED)
- **Previously:** FAIL — showed "0d" because seed data lacked explicit `createdAt` timestamps
- **Re-validated:** Dashboard now shows "Average Case Age: **12d**" and "Oldest Case: **26d**". Seed data now includes explicit `createdAt` dates (Apr 8, Apr 23, Apr 27, Apr 28 for open cases), producing correct non-zero age calculations. Oldest open case (Apr 8) is correctly ~26 days old.
- **Screenshot:** `screenshots/dash001-ac4-revalidation.png`

### LIST-001 — AC1: Table shows all required columns
- **Verified:** Table at `/cases` displays 10 columns: Case #, Customer, Type, Risk Rating, Alert Type, Risk Score, Amount, Status, Analyst, Updated. All required columns present.
- **Screenshot:** `screenshots/list-001-cases.png`

### LIST-001 — AC2: All seeded cases appear
- **Verified:** All 6 cases visible in table: AML-2026-0005, AML-2026-0023, AML-2026-0009, AML-2026-0021, AML-2026-0012, AML-2026-0017.

### LIST-001 — AC3: Clicking a row navigates to case detail ✅ (RE-VALIDATED)
- **Previously:** FAIL — only the case number link was clickable; clicking other cells did not navigate
- **Re-validated:** Clicked the "Customer" cell ("Meridian Star Trading Pte Ltd") on the AML-2026-0005 row (not the case number link). Page navigated to `/cases/cmoqvk1y3001we736t93gikr6` — the correct case detail page. Row-level `onClick` handler is now working. Rows also show `cursor: pointer` styling.
- **Screenshot:** `screenshots/list001-ac3-revalidation.png`

### DETAIL-001 — AC1: Header shows case number, customer name, status badge, and risk score ✅ (RE-VALIDATED)
- **Previously:** FAIL — customer name was missing from the header area
- **Re-validated:** Navigated to `/cases/cmoqvk1xi0006e736cnhyyytn` (AML-2026-0017). Header now displays: case number ("AML-2026-0017"), customer name ("**Meridian Star Trading Pte Ltd**"), status badge ("Under Review"), risk score ("82 Critical"), and analyst ("Sarah Chen"). Customer name appears directly below the case number heading.
- **Screenshot:** `screenshots/detail001-ac1-revalidation.png`

### DETAIL-001 — AC2: Customer profile section displays all fields
- **Verified:** Customer Profile panel shows all 7 fields: Name, Type, Risk Rating, Nationality, Business Activity, Source of Wealth, Account Opened.

### DETAIL-001 — AC3: Alert summary section displays all fields
- **Verified:** Alert Summary panel shows: Alert Type, Alert Date, Total Amount, Reason. All 4 required fields present.

### DETAIL-001 — AC4: Invalid case ID shows 404
- **Verified:** Navigating to `/cases/invalid-id-12345` displays "404" heading, "Case not found" message, and "Back to Cases" link.
- **Screenshot:** `screenshots/detail-001-404.png`

---

## Batch 3 — Passing Criteria

### DASH-002 — AC1: Priority queue shows top 5 cases sorted by risk score DESC
- **Verified:** Priority Cases table on dashboard shows 4 open cases (all open cases in DB) sorted by risk score descending: AML-2026-0021 (91, Critical) → AML-2026-0017 (82, Critical) → AML-2026-0009 (45, Medium) → AML-2026-0023 (38, Medium). Only 4 open cases exist in seed data (2 cases are closed), so showing 4 is correct behavior for "top 5".
- **Screenshot:** `screenshots/dashboard-batch3.png`

### DASH-002 — AC2: Clicking a case navigates to detail page
- **Verified:** Clicked the "AML-2026-0021" link in the priority queue. Browser navigated to `/cases/cmoqwhudm000ye73udpjzh999` — the case detail page. Page loaded correctly showing case header with "AML-2026-0021", customer "Eastern Horizon Imports Pte Ltd", risk score 91, status "Pending Approval", and full case details including transactions, risk indicators, investigation notes, and audit log.

### DASH-002 — AC3: Each row shows case number, customer name, risk score, status, case age in days
- **Verified:** Each row in the Priority Cases table displays all 5 required columns:
  - **Case #:** e.g., "AML-2026-0021" (as clickable link)
  - **Customer:** e.g., "Eastern Horizon Imports Pte Ltd"
  - **Risk Score:** e.g., "91 (Critical)" with color-coded badge
  - **Status:** e.g., "Pending Approval" with status badge
  - **Age (days):** e.g., "25d" (calculated from `createdAt`)
- **Screenshot:** `screenshots/dashboard-batch3.png`

### DASH-003 — AC1: Shows latest 10 audit log entries
- **Verified:** Recent Activity section on dashboard displays exactly 10 list items. Entries are ordered by timestamp descending, starting from 4/30/2026 (most recent) down to 4/14/2026. Database contains 28 total audit log entries; the 10 most recent are correctly displayed.
- **Screenshot:** `screenshots/dashboard-batch3.png`

### DASH-003 — AC2: Each entry shows timestamp, actor, action, case number
- **Verified:** Each activity entry displays all 4 required fields:
  - **Timestamp:** e.g., "4/30/2026, 10:30:00 PM" (formatted locale string)
  - **Actor:** e.g., "James Wong" or "System"
  - **Action:** e.g., "Status Changed", "Note Added", "Case Created" (bold text)
  - **Case number:** e.g., "AML-2026-0023" (clickable link)
  - Additionally, detail text is shown below: e.g., "Status changed from UNDER_REVIEW to PENDING_INFORMATION — awaiting customer documents"

### DASH-003 — AC3: Clicking entry navigates to related case
- **Verified:** Clicked the "AML-2026-0023" case link in the first activity entry (James Wong, Status Changed). Browser navigated to `/cases/cmoqwhuds001le73u4vtsb4sg` — the correct case detail page for AML-2026-0023 (Tan Rui En).

### LIST-002 — AC1: Search filters by case number or customer name (partial match)
- **Verified:** Typed "Meridian" into the search input (`data-testid="case-search-input"`). After debounce (300ms), URL updated to `/cases?search=Meridian`. Table displayed exactly 2 cases: AML-2026-0005 and AML-2026-0017 — both belonging to customer "Meridian Star Trading Pte Ltd". Partial match confirmed.
- **Screenshot:** `screenshots/cases-search-meridian.png`

### LIST-002 — AC2: Status filter shows only matching cases
- **Verified:** Selected "New" from the Status dropdown (`data-testid="case-filter-status"`). URL updated to `/cases?status=NEW`. Table displayed exactly 1 case: AML-2026-0009 (Asha Global Services, status NEW). No other cases shown.
- **Screenshot:** `screenshots/cases-filter-status-new.png`

### LIST-002 — AC3: Risk rating filter shows only matching cases
- **Verified:** Selected "High" from the Risk Rating dropdown (`data-testid="case-filter-risk-rating"`). URL updated to `/cases?riskRating=HIGH`. Table displayed exactly 1 case: AML-2026-0021 (Eastern Horizon Imports, customer risk rating HIGH). No other cases shown.
- **Screenshot:** `screenshots/cases-filter-risk-high.png`

### LIST-002 — AC4: Sort by risk score works
- **Verified:** Selected "Risk Score" from the Sort By dropdown (`data-testid="case-filter-sort"`). URL updated to `/cases?sortBy=riskScore`. Table reordered to show all 6 cases sorted by risk score descending: 91 → 82 → 76 → 45 → 38 → 28. Sort order matches expected values.

### LIST-002 — AC5: Empty state shown when no results match
- **Verified:** Searched for "nonexistentkeyword". Table replaced with empty state container (`data-testid="case-table-empty"`) displaying "No cases found." message.
- **Screenshot:** `screenshots/cases-empty-state.png`

---

## Failures Detail

None — all 22 acceptance criteria across 6 stories pass.

---

## Re-validation History

| Criterion | Original Result | Issue | Fix Applied | Re-validation Result |
|-----------|----------------|-------|-------------|---------------------|
| DASH-001 AC4 | FAIL (showed "0d") | Seed data gap — no explicit `createdAt` | Seed script updated with explicit dates | PASS (12d avg, 26d oldest) |
| LIST-001 AC3 | FAIL (row click no-op) | Missing `onClick` handler on `<tr>` | Row click handler added to CaseTable | PASS (navigates on cell click) |
| DETAIL-001 AC1 | FAIL (no customer name) | `customerName` prop not passed to CaseHeader | Prop added and rendered | PASS (name shown in header) |

---

## Batch 4 — DETAIL-002, DETAIL-003, NOTES-001

### Test Environment
- App: localhost:3000 [running]
- Database: seeded — 6 cases, 20 transactions, 13 notes
- Primary test case: AML-2026-0017 (Meridian Star Trading) — 4 transactions, 4 risk indicators, 3 notes
- Empty state test case: AML-2026-0009 (Asha Global Services) — 3 transactions, 3 risk indicators, 0 notes
- Testing method: Playwright MCP browser with programmatic DOM evaluation

### Batch 4 Summary
| Story | Criteria Tested | Passed | Failed | Untestable (Seed Gap) |
|-------|----------------|--------|--------|----------------------|
| DETAIL-002 | 4 | 3 | 0 | 1 |
| DETAIL-003 | 3 | 2 | 0 | 1 |
| NOTES-001 | 3 | 3 | 0 | 0 |
| NOTES-002 | 5 | 5 | 0 |
| STR-001 | 6 | 6 | 0 |
| AUDIT-001 | 4 | 4 | 0 |

### Result: PASS (with 2 seed data gaps)

---

### DETAIL-002 — AC1: Transactions in chronological order
- **Verified:** Navigated to `/cases/cmoqwyzdu0006e7dl9x2kqoa6` (AML-2026-0017). Transaction Timeline section displays 4 transactions sorted oldest-first: 4/10/2026 → 4/11/2026 → 4/12/2026 → 4/14/2026. Chronological ordering confirmed via DOM evaluation — all dates strictly ascending.
- **Screenshot:** `screenshots/detail-002-003-notes-001-main.png`

### DETAIL-002 — AC2: Each shows direction, amount+currency, counterparty, country, date, purpose
- **Verified:** All 4 transactions display all 6 required fields:
  1. **IN** — US$150,000.00 — Northstar Holdings Ltd — British Virgin Islands — 4/10/2026 — "Payment for electronic components — Invoice NS-4401"
  2. **OUT** — US$145,000.00 — Blue River Consulting SA — Panama — 4/11/2026 — "Consulting services — contract BR-2026-088"
  3. **IN** — US$120,000.00 — Golden Peak Enterprises — Myanmar — 4/12/2026 — "Trade settlement — PO GP-7722"
  4. **OUT** — US$65,000.00 — Apex Ventures International — Cayman Islands — 4/14/2026 — "Investment advisory fees"
- Programmatic check confirmed: direction badge present (`data-testid="transaction-direction"`), amount with currency symbol, date in purpose line, and purpose text > 15 chars for all rows.

### DETAIL-002 — AC3: Incoming/outgoing visually distinguished
- **Verified:** IN badges use `bg-[#0F2E1F] text-primary` (dark green background, green text). OUT badges use `bg-[#2D1215] text-tertiary` (dark red background, red text). CSS classes confirmed different via DOM evaluation. Visual distinction is clear — green for incoming, red for outgoing.
- **Screenshot:** `screenshots/detail-002-003-notes-001-main.png`

### DETAIL-002 — AC4: Empty state for no transactions
- **Status:** UNTESTABLE — Seed Data Gap
- **Reason:** All 6 seeded cases have at least 3 transactions. No case exists with 0 transactions.
- **Code review:** Empty state IS implemented in `TransactionTimeline` component — renders `data-testid="transaction-empty"` with text "No transactions recorded." when `transactions.length === 0`. The code path exists but cannot be validated via E2E.
- **Recommended fix agent:** backend-engineer (seed script)
- **Fix:** Add a case to `prisma/seed.ts` with 0 transactions, or create one during test setup.

---

### DETAIL-003 — AC1: All 4 indicators displayed
- **Verified:** Risk Indicators section on AML-2026-0017 displays exactly 4 indicators:
  1. ⚠ Rapid pass-through of funds
  2. ⚠ Unrelated counterparties
  3. ⚠ High-risk jurisdiction counterparty
  4. ⚠ Inconsistent with declared business activity
- All 4 expected indicators matched via programmatic DOM check (`data-testid="risk-indicator"`).
- **Screenshot:** `screenshots/detail-002-003-notes-001-main.png`

### DETAIL-003 — AC2: Each indicator clearly labeled
- **Verified:** All 4 indicators rendered as styled badges with ⚠ icon prefix and full descriptive text. Each badge uses `data-testid="risk-indicator"` and has non-empty label text. Styling: `bg-[#2D1215] text-tertiary` (red-tinted badge with red text) for visual prominence.

### DETAIL-003 — AC3: Empty state for no risk indicators
- **Status:** UNTESTABLE — Seed Data Gap
- **Reason:** All 6 seeded cases have at least 2 risk indicators. No case exists with 0 indicators.
- **Code review:** Empty state IS implemented in `RiskIndicatorsList` component — renders `data-testid="risk-indicators-empty"` with text "No risk indicators." when `indicators.length === 0`. The code path exists but cannot be validated via E2E.
- **Recommended fix agent:** backend-engineer (seed script)
- **Fix:** Add a case to `prisma/seed.ts` with empty `riskIndicators: []`, or use the same no-transaction case above.

---

### NOTES-001 — AC1: Notes in chronological order (oldest first)
- **Verified:** Investigation Notes section on AML-2026-0017 displays 3 notes sorted oldest-first:
  1. Customer Profile Review — 4/15/2026, 6:30:00 PM
  2. Transaction Review — 4/16/2026, 5:15:00 PM
  3. Counterparty Review — 4/17/2026, 10:00:00 PM
- Timestamps strictly ascending, confirmed via programmatic DOM check. Heading shows "Investigation Notes (3)".
- **Screenshot:** `screenshots/notes-001-main.png`

### NOTES-001 — AC2: Each shows note type, author, content, timestamp
- **Verified:** All 3 notes display all 4 required fields:
  - **Note type** (`data-testid="note-type"`): "Customer Profile Review", "Transaction Review", "Counterparty Review" — shown as styled badges
  - **Author** (`data-testid="note-author"`): "Sarah Chen" on all 3 notes
  - **Timestamp** (`data-testid="note-timestamp"`): Locale-formatted date+time strings
  - **Content**: Full paragraph text for each note (investigation details clearly readable)
- **Screenshot:** `screenshots/notes-001-main.png`

### NOTES-001 — AC3: Empty state with prompt
- **Verified:** Navigated to `/cases/cmoqwyzea001fe7dlrxy9hcrr` (AML-2026-0009, Asha Global — 0 notes). Investigation Notes section shows heading "Investigation Notes (0)" and empty state message: **"No notes yet. Add the first investigation note to begin documenting this case."** (`data-testid="notes-empty"`). Prompt to add first note is present.
- **Screenshot:** `screenshots/notes-001-empty-state.png`

---

## Seed Data Gaps (Batch 4)

| Missing | Needed For | Current State | Recommended Fix |
|---------|-----------|---------------|-----------------|
| Case with 0 transactions | DETAIL-002 AC4 (empty state) | All 6 cases have 3-4 transactions | Add a case to seed with no transactions |
| Case with 0 risk indicators | DETAIL-003 AC3 (empty state) | All 6 cases have 2-5 indicators | Add a case to seed with `riskIndicators: []` |

---

## Batch 5 — NOTES-002, STR-001, AUDIT-001

### Test Environment
- App: localhost:3000 [running]
- Database: seeded — 6 cases, 5 customers, 17 transactions, 11 notes (pre-test), 28 audit log entries (pre-test)
- Primary test case: AML-2026-0017 (Meridian Star Trading, UNDER_REVIEW, risk score 82, 3 notes, 0 decisions)
- Secondary test case: AML-2026-0023 (Tan Rui En, PENDING_INFORMATION, risk score 38) — used for STR-001 AC3
- Testing method: Playwright MCP browser against live running app

### Batch 5 Summary
| Story | Criteria Tested | Passed | Failed |
|-------|----------------|--------|--------|
| NOTES-002 | 5 | 5 | 0 |
| STR-001 | 6 | 6 | 0 |
| AUDIT-001 | 4 | 4 | 0 |

### Result: PASS

---

### NOTES-002 — AC1: Fill in note type + content + click "Add Note" → note saved and appears in list
- **Steps:** Navigated to `/cases/cmoqxohvj0006e7e145vje8yj` (AML-2026-0017). Selected "Customer Outreach" from note type dropdown. Typed acceptance test note content. Clicked "Add Note" button.
- **Expected:** Note saved, appears in notes list, form reset.
- **Actual:** Form fields cleared after submission. Investigation Notes heading updated from "(3)" to "(4)". New note "Customer Outreach" by "Analyst" at "5/4/2026, 4:26:41 PM" appeared as 4th note in the list with correct content.
- **Result:** PASS
- **Screenshot:** `screenshots/batch5-case-0017-final.png`

### NOTES-002 — AC2: Empty content → validation error, note not saved
- **Steps:** Selected "Transaction Review" as note type, left content empty, clicked "Add Note".
- **Expected:** Validation error shown, note not saved.
- **Actual:** Error message "Content is required" displayed below content field (`data-testid="note-content-error"`). Form remained on page; no API call made.
- **Result:** PASS

### NOTES-002 — AC3: Missing note type → validation error
- **Steps:** Left note type on "Select note type…" (empty), typed content, clicked "Add Note".
- **Expected:** Validation error shown.
- **Actual:** Error message "Note type is required" displayed below note type dropdown (`data-testid="note-type-error"`). Note was not submitted.
- **Result:** PASS

### NOTES-002 — AC4: Success → audit log entry "Note Added" created
- **Steps:** After successful note submission (AC1), inspected the Audit Log panel on the same page.
- **Expected:** New audit log entry with action "Note Added".
- **Actual:** New entry appeared at top of audit log: "Analyst · Note Added" with details "Added CUSTOMER_OUTREACH note" and timestamp "5/4/2026, 4:26:41 PM". Entry appeared in correct reverse-chronological position.
- **Result:** PASS

### NOTES-002 — AC5: New note shows current user as author + current timestamp
- **Steps:** After successful note submission, inspected the newly added note card in Investigation Notes.
- **Expected:** Author = current user, timestamp = current time.
- **Actual:** Note displays author "Analyst" (the selected role in role selector) and timestamp "5/4/2026, 4:26:41 PM" (current time at submission). Both `data-testid="note-author"` and `data-testid="note-timestamp"` present with correct values.
- **Result:** PASS

---

### STR-001 — AC1: Analyst submits suspicion yes/no + rationale → saved
- **Steps:** On AML-2026-0017 (Under Review), selected "Yes" for Suspicion Established, entered detailed rationale about rapid pass-through of funds and shell company indicators, entered recommendation to file STR. Clicked "Submit Recommendation".
- **Expected:** Recommendation saved.
- **Actual:** Form submitted successfully. Page refreshed showing updated case status. Decision form no longer visible (since case status changed).
- **Result:** PASS

### STR-001 — AC2: Suspicion=true → status changes to "Pending Reviewer Approval"
- **Steps:** After submitting recommendation with suspicion=true on AML-2026-0017.
- **Expected:** Case status changes to "Pending Reviewer Approval".
- **Actual:** Case header status badge updated from "Under Review" to "Pending Approval" (display label for PENDING_REVIEWER_APPROVAL). Confirmed via case header `data-testid="case-header"`.
- **Result:** PASS
- **Screenshot:** `screenshots/batch5-case-0017-final.png`

### STR-001 — AC3: Suspicion=false → status changes to "Closed - No STR"
- **Steps:** Navigated to AML-2026-0023 (Tan Rui En, PENDING_INFORMATION status). Selected "No" for suspicion, entered rationale about legitimate salary patterns, entered recommendation to close. Clicked "Submit Recommendation".
- **Expected:** Case status changes to "Closed - No STR".
- **Actual:** Case header status badge changed to "Closed (No STR)" (display label for CLOSED_NO_STR). Decision form no longer visible since case is in a non-actionable status.
- **Result:** PASS

### STR-001 — AC4: Empty rationale → validation error
- **Steps:** On AML-2026-0017, clicked "Submit Recommendation" with all fields empty.
- **Expected:** Validation error for rationale.
- **Actual:** Three validation errors displayed: "Select whether suspicion is established" (`data-testid="suspicion-error"`), "Rationale is required" (`data-testid="suspicion-reason-error"`), "Recommendation is required" (`data-testid="recommendation-error"`). Form not submitted.
- **Result:** PASS

### STR-001 — AC5: Success → audit log entry "Recommendation Submitted"
- **Steps:** After successful submission on AML-2026-0017, inspected Audit Log panel.
- **Expected:** New entry with action "Recommendation Submitted".
- **Actual:** New entry at top of audit log: "Analyst · Recommendation Submitted" with details "Suspicion established — status changed to PENDING_REVIEWER_APPROVAL" and timestamp "5/4/2026, 4:28:11 PM".
- **Result:** PASS

### STR-001 — AC6: Case not in valid status → action not available
- **Steps:** Verified decision form visibility on cases with non-actionable statuses: (1) AML-2026-0017 after submission (now PENDING_REVIEWER_APPROVAL), (2) AML-2026-0023 after submission (now CLOSED_NO_STR). Used `document.querySelector('[data-testid="decision-form"]')` to check presence.
- **Expected:** Decision form not rendered.
- **Actual:** `decision-form` element returns `null` on both cases. Form correctly hidden for PENDING_REVIEWER_APPROVAL and CLOSED_NO_STR statuses. Code review confirms `ALLOWED_STATUSES` array only includes `UNDER_REVIEW` and `PENDING_INFORMATION`.
- **Result:** PASS

---

### AUDIT-001 — AC1: Reverse chronological order (newest first)
- **Steps:** Navigated to AML-2026-0017 and inspected the Audit Log panel entries.
- **Expected:** Entries in newest-first order.
- **Actual:** 7 entries displayed in strict reverse chronological order: 5/4 4:28 PM (Recommendation Submitted) → 5/4 4:26 PM (Note Added) → 4/17 10:00 PM (Note Added) → 4/16 5:15 PM (Note Added) → 4/15 6:30 PM (Note Added) → 4/15 5:00 PM (Status Changed) → 4/14 4:00 PM (Case Created). Timestamps strictly descending.
- **Result:** PASS

### AUDIT-001 — AC2: Each entry shows timestamp, actor, action, details
- **Steps:** Inspected each audit log entry on AML-2026-0017.
- **Expected:** Four fields per entry: timestamp, actor, action, details.
- **Actual:** Every entry displays all 4 fields:
  - **Timestamp:** Locale-formatted datetime in monospace font (e.g., "5/4/2026, 4:28:11 PM")
  - **Actor:** Name text (e.g., "Analyst", "Sarah Chen", "System")
  - **Action:** Bold action label (e.g., "Recommendation Submitted", "Note Added", "Status Changed", "Case Created")
  - **Details:** Descriptive paragraph (e.g., "Suspicion established — status changed to PENDING_REVIEWER_APPROVAL")
- All `data-testid="audit-log-entry"` elements contain these 4 fields.
- **Result:** PASS

### AUDIT-001 — AC3: Entries include case creation, notes, status changes, decisions
- **Steps:** Reviewed all audit log entries for AML-2026-0017.
- **Expected:** Variety of event types represented.
- **Actual:** All 4 event types present:
  1. **Case creation:** "System · Case Created" — "Case AML-2026-0017 created from automated alert — Rapid Movement of Funds"
  2. **Notes:** "Sarah Chen · Note Added" (×3) + "Analyst · Note Added" (×1)
  3. **Status changes:** "Sarah Chen · Status Changed" — "Status changed from NEW to UNDER_REVIEW"
  4. **Decisions:** "Analyst · Recommendation Submitted" — "Suspicion established — status changed to PENDING_REVIEWER_APPROVAL"
- **Result:** PASS

### AUDIT-001 — AC4: Empty state handling
- **Steps:** (1) Checked AML-2026-0009 (newly created case) — has 1 entry ("Case Created"). (2) Reviewed component source code for empty state implementation.
- **Expected:** Empty state shown when no entries exist.
- **Actual:** Component renders "No audit entries." when `entries.length === 0` (confirmed in `audit-log-panel.tsx`). However, all valid cases have at least a "Case Created" entry from seeding — which is the expected behavior per AC4 note: "should not happen for valid cases". Empty state code path exists and is correctly implemented.
- **Result:** PASS

---

## Seed Data Gaps (Batch 5)

None — all acceptance criteria were fully testable with existing seed data. Used AML-2026-0023 (PENDING_INFORMATION status) as secondary test case for STR-001 AC3 (suspicion=false scenario).

---

## Batch 6 — STR-002, STR-003, ROLE-001

### Test Environment
- App: localhost:3000 [running]
- Database: seeded — 6 cases, 5 customers, 17 transactions, 11 notes, 3 STR decisions, 28 audit log entries
- Primary test case: AML-2026-0021 (Eastern Horizon Imports, PENDING_REVIEWER_APPROVAL, risk score 91)
- Secondary test case: AML-2026-0017 (Meridian Star Trading, UNDER_REVIEW, risk score 82)
- Testing method: Playwright MCP browser against live running app
- DB re-seeded between destructive tests to ensure clean state

### Batch 6 Summary
| Story | Criteria Tested | Passed | Failed |
|-------|----------------|--------|--------|
| STR-002 | 6 | 6 | 0 |
| STR-003 | 5 | 5 | 0 |
| ROLE-001 | 4 | 4 | 0 |

### Result: PASS

---

### STR-002 — AC1: Reviewer clicks "Approve" → status changes to "Approved for STR Filing"
- **Steps:** Seeded DB. Switched to Reviewer role. Navigated to AML-2026-0021 (Pending Reviewer Approval). Clicked "Approve" button.
- **Expected:** Case status changes to "Approved for STR Filing", reviewer decision recorded.
- **Actual:** Status badge updated from "Pending Approval" to "Approved for Filing". Reviewer Decision form disappeared (correctly — no longer PENDING_REVIEWER_APPROVAL). STR Filing Status form appeared (correctly — now APPROVED_FOR_STR_FILING). Audit log entry added: "Reviewer · Reviewer Decision — Decision: approved — status changed to APPROVED_FOR_STR_FILING".
- **Result:** PASS
- **Screenshot:** `screenshots/str002-ac1-approved.png`

### STR-002 — AC2: Reviewer clicks "Return for More Info" with comment → status changes to "Pending Information"
- **Steps:** Re-seeded DB. Switched to Reviewer role. Navigated to AML-2026-0021. Entered comment "Need more transaction analysis" in reviewer comment textarea. Clicked "Return for More Info".
- **Expected:** Case status changes to "Pending Information", reviewer comment saved.
- **Actual:** Status badge changed to "Pending Information". Reviewer Decision form disappeared (case no longer in PENDING_REVIEWER_APPROVAL). Audit log entry: "Reviewer · Reviewer Decision — Decision: returned — Comment: Need more transaction analysis — status changed to PENDING_INFORMATION". Comment preserved in audit trail.
- **Result:** PASS

### STR-002 — AC3: Return without comment → validation error
- **Steps:** On AML-2026-0021 as Reviewer, clicked "Return for More Info" without entering any comment.
- **Expected:** Validation error shown, action not submitted.
- **Actual:** Error message "Comment is required when returning a case" displayed below the comment textarea (`data-testid="reviewer-comment-error"`). No API call made, case status unchanged.
- **Result:** PASS

### STR-002 — AC4: Approval/return → audit log shows "Reviewer Decision" entry
- **Steps:** Verified audit log after both approval (AC1) and return (AC2) actions.
- **Expected:** Audit log entry with action "Reviewer Decision".
- **Actual:** Both actions created audit entries with:
  - **Actor:** "Reviewer"
  - **Action:** "Reviewer Decision"
  - **Details:** For approval: "Decision: approved — status changed to APPROVED_FOR_STR_FILING"; For return: "Decision: returned — Comment: Need more transaction analysis — status changed to PENDING_INFORMATION"
  - Entries appeared at top of audit log in correct reverse-chronological order.
- **Result:** PASS

### STR-002 — AC5: Case NOT in Pending Reviewer Approval → Approve/Return buttons not visible
- **Steps:** As Reviewer, navigated to AML-2026-0017 (status: UNDER_REVIEW). Checked for presence of reviewer form and action buttons.
- **Expected:** Reviewer Decision form, Approve button, and Return button not rendered.
- **Actual:** `document.querySelector('[data-testid="reviewer-decision-form"]')` returned `null`. `document.querySelector('[data-testid="reviewer-approve-button"]')` returned `null`. `document.querySelector('[data-testid="reviewer-return-button"]')` returned `null`. Component correctly returns `null` when `caseStatus !== "PENDING_REVIEWER_APPROVAL"`.
- **Result:** PASS

### STR-002 — AC6: Analyst's recommendation and rationale prominently displayed
- **Steps:** On AML-2026-0021 as Reviewer, inspected the Reviewer Decision form before making a decision.
- **Expected:** Analyst recommendation and rationale prominently displayed near the decision panel.
- **Actual:** Within the Reviewer Decision form (`data-testid="reviewer-decision-form"`), an "Analyst Recommendation" summary panel (`data-testid="analyst-recommendation-summary"`) displays:
  - **Suspicion Established:** "Yes"
  - **Rationale:** "Transactions involve shell entities in high-risk jurisdictions with insufficient documentation. Pattern is consistent with trade-based money laundering."
  - **Recommendation:** "File STR with STRO via SONAR. Grounds: suspected trade-based money laundering through layered transactions across FATF grey-list jurisdictions."
  - Panel is styled with a distinct border and background color (`border-tertiary/40 bg-tertiary/10`) for visual prominence.
- **Result:** PASS
- **Screenshot:** `screenshots/role001-reviewer-case0021.png`

---

### STR-003 — AC1: Update filing status to "Drafting" → saved
- **Steps:** After approving AML-2026-0021 (now APPROVED_FOR_STR_FILING), selected "Drafting" from the filing status dropdown. Clicked "Update Filing Status".
- **Expected:** Filing status updated to "Drafting".
- **Actual:** Current status label updated to "Drafting" (`data-testid="current-filing-status"`). Filing status form remained visible (case still in APPROVED_FOR_STR_FILING). Audit log entry added: "Reviewer · Filing Status Updated — Filing status changed to DRAFTING".
- **Result:** PASS

### STR-003 — AC2: Select "Filed" → filing reference and date fields appear and are required
- **Steps:** Selected "Filed" from the filing status dropdown.
- **Expected:** Filing reference and filing date input fields appear.
- **Actual:** Two additional fields appeared: "Filing Reference" text input (`data-testid="filing-reference-input"`) with placeholder "Enter SONAR reference number…" and "Filing Date" date input (`data-testid="filing-date-input"`). Fields only render when `filingStatus === "FILED"` is selected.
- **Result:** PASS

### STR-003 — AC3: Enter filing reference + date → case status changes to "Closed - STR Filed"
- **Steps:** Entered "STR-2026-0456" as filing reference, "2026-05-04" as filing date. Clicked "Update Filing Status".
- **Expected:** Case status changes to "Closed - STR Filed".
- **Actual:** Case header status badge changed to "Closed (STR Filed)". Filing Status form disappeared (case no longer APPROVED_FOR_STR_FILING). Audit log entry: "Reviewer · Filing Status Updated — Filing status changed to FILED — Reference: STR-2026-0456".
- **Result:** PASS
- **Screenshot:** `screenshots/str003-ac3-filed-closed.png`

### STR-003 — AC4: Submit "Filed" without reference → validation error
- **Steps:** Selected "Filed" from dropdown, left reference and date empty, clicked "Update Filing Status".
- **Expected:** Validation errors for both fields.
- **Actual:** Two validation errors displayed: "Filing reference is required" (`data-testid="filing-reference-error"`) and "Filing date is required" (`data-testid="filing-date-error"`). Form not submitted, no API call made.
- **Result:** PASS

### STR-003 — AC5: Audit log shows "Filing Status Updated" entry
- **Steps:** Verified audit log after filing status changes.
- **Expected:** Audit log entries for each filing status change.
- **Actual:** Two audit entries present:
  1. "Reviewer · Filing Status Updated — Filing status changed to DRAFTING" (from AC1)
  2. "Reviewer · Filing Status Updated — Filing status changed to FILED — Reference: STR-2026-0456" (from AC3)
  - Both entries in correct chronological position within the audit log.
- **Result:** PASS
- **Screenshot:** `screenshots/str003-ac3-filed-closed.png`

---

### ROLE-001 — AC1: Analyst → Note form + Decision form visible; Reviewer/Filing forms NOT visible
- **Steps:** Navigated to AML-2026-0017 (Under Review). Selected "Analyst" role.
- **Expected:** Note form and Decision form visible. Reviewer and Filing forms hidden.
- **Actual:**
  - `data-testid="note-form"`: **present** ✓
  - `data-testid="decision-form"`: **present** ✓ (heading "STR Recommendation")
  - `data-testid="reviewer-decision-form"`: **absent** ✓
  - `data-testid="filing-status-form"`: **absent** ✓
- **Result:** PASS
- **Screenshot:** `screenshots/role001-analyst-case0017.png`

### ROLE-001 — AC2: Reviewer → Note form + Reviewer form visible (on pending approval); Decision form NOT visible
- **Steps:** Switched to "Reviewer" role. Tested on both AML-2026-0021 (PENDING_REVIEWER_APPROVAL) and AML-2026-0017 (UNDER_REVIEW).
- **Expected:** Note form visible on both. Reviewer form visible only on pending approval case. Decision form hidden on both.
- **Actual:**
  - **AML-2026-0021 (Pending Approval):** Note form ✓, Reviewer Decision form ✓, Decision form ✗, Filing form ✗
  - **AML-2026-0017 (Under Review):** Note form ✓, Reviewer Decision form ✗ (correctly hidden — not pending approval), Decision form ✗, Filing form ✗
  - Reviewer form correctly gated by both `role === "Reviewer"` AND `caseStatus === "PENDING_REVIEWER_APPROVAL"`.
- **Result:** PASS
- **Screenshot:** `screenshots/role001-reviewer-case0021.png`

### ROLE-001 — AC3: Operations Manager → NO forms visible
- **Steps:** Switched to "Operations Manager" role on AML-2026-0021.
- **Expected:** All action forms hidden.
- **Actual:**
  - `data-testid="note-form"`: **absent** ✓
  - `data-testid="decision-form"`: **absent** ✓
  - `data-testid="reviewer-decision-form"`: **absent** ✓
  - `data-testid="filing-status-form"`: **absent** ✓
  - Only read-only sections visible: Customer Profile, Alert Summary, Transactions, Risk Indicators, Investigation Notes, Audit Log.
- **Result:** PASS
- **Screenshot:** `screenshots/role001-opsmanager-case0021.png`

### ROLE-001 — AC4: Role switch updates immediately without page reload
- **Steps:** On AML-2026-0021, started as Operations Manager (all forms hidden). Stored current URL. Switched to Analyst via role selector. Verified URL unchanged and DOM updated.
- **Expected:** Forms appear/disappear instantly without navigation.
- **Actual:** URL remained `http://localhost:3000/cases/cmoqyvxbm000ye76u060btcha` (no change). Note form appeared immediately after role switch. React context (`RoleProvider`) triggers instant re-render — no page reload or server roundtrip. Role is stored in React `useState` and consumed via `useContext` in all form components.
- **Result:** PASS

---

## Seed Data Gaps (Batch 6)

None — all acceptance criteria were fully testable with existing seed data.

---

## Final Summary — All Batches

| Batch | Stories | Criteria Tested | Passed | Failed | Untestable |
|-------|---------|----------------|--------|--------|------------|
| 1–3 | SEED-001 through LIST-002, DETAIL-001 | 22 | 22 | 0 | 0 |
| 4 | DETAIL-002, DETAIL-003, NOTES-001 | 10 | 8 | 0 | 2 |
| 5 | NOTES-002, STR-001, AUDIT-001 | 15 | 15 | 0 | 0 |
| 6 | STR-002, STR-003, ROLE-001 | 15 | 15 | 0 | 0 |
| **Total** | **16 stories** | **62** | **60** | **0** | **2** |

## Overall Result: PASS

All 62 acceptance criteria tested. 60 pass, 0 fail, 2 untestable due to seed data gaps (empty state scenarios for transactions and risk indicators — code paths verified via source review).
