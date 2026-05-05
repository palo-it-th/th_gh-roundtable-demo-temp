# Test Report

## Environment
- Node: v22.17.1
- Database: PostgreSQL via Docker (`aml-case-db`) — Up, healthy
- Build: **PASS**

## Build Output
Clean — 0 errors (`npx tsc --noEmit` produced no output)

## Summary
| Suite | Total | Passed | Failed | Skipped | Duration |
|-------|-------|--------|--------|---------|----------|
| Vitest | 59 | 59 | 0 | 0 | 3.98s |
| Playwright | — | — | — | — | N/A (no config or spec files) |

## Result: PASS

## Test Details (Vitest)

### app/api/cases/[id]/route.test.ts (4 tests)
- ✓ returns full case with all relations for a valid ID (10ms)
- ✓ returns case with null decision when no STR decision exists
- ✓ returns 404 for non-existent case
- ✓ returns 500 when Prisma throws

### app/api/dashboard/summary/route.test.ts (5 tests)
- ✓ returns correct dashboard summary structure
- ✓ filters highRiskCases by riskScore >= 76
- ✓ excludes CLOSED_NO_STR and CLOSED_STR_FILED from open case counts
- ✓ handles zero open cases for age calculation
- ✓ returns 500 when Prisma throws

### app/api/cases/[id]/notes/route.test.ts (7 tests)
- ✓ creates a note and returns 201
- ✓ auto-transitions case from NEW to UNDER_REVIEW on first note
- ✓ returns 400 for empty content
- ✓ returns 400 for missing noteType
- ✓ returns 400 for invalid noteType
- ✓ returns 404 for non-existent case
- ✓ returns 500 when Prisma throws

### app/api/cases/route.test.ts (7 tests)
- ✓ returns cases with default params
- ✓ applies search filter for partial caseNumber match
- ✓ applies status filter
- ✓ applies riskRating filter
- ✓ sorts by riskScore when requested
- ✓ returns 400 for invalid query params
- ✓ returns 500 when Prisma throws

### app/api/cases/[id]/filing/route.test.ts (8 tests)
- ✓ updates filing status to DRAFTING and returns 200
- ✓ updates filing status to READY_FOR_FILING and returns 200
- ✓ updates filing status to FILED with reference and closes case
- ✓ returns 400 when FILED without filingReference
- ✓ returns 400 when FILED without filedAt
- ✓ returns 409 when case is not in APPROVED_FOR_STR_FILING status
- ✓ returns 404 for non-existent case
- ✓ returns 500 when Prisma throws

### app/api/cases/[id]/decision/route.test.ts (15 tests)
- ✓ creates decision with suspicion established and returns 201
- ✓ creates decision with no suspicion and returns 201
- ✓ accepts case in PENDING_INFORMATION status
- ✓ returns 400 for empty suspicionReason
- ✓ returns 400 for missing suspicionEstablished
- ✓ returns 404 for non-existent case
- ✓ returns 409 when case is in NEW status
- ✓ returns 409 when case is in CLOSED_NO_STR status
- ✓ returns 500 when Prisma throws
- ✓ approves case and changes status to APPROVED_FOR_STR_FILING
- ✓ returns case with comment and changes status to PENDING_INFORMATION
- ✓ returns 400 when returning without comment
- ✓ returns 409 when case is not in PENDING_REVIEWER_APPROVAL status
- ✓ returns 404 for non-existent case
- ✓ returns 500 when Prisma throws

### components/case-detail/risk-indicators-list.test.tsx (4 tests)
- ✓ renders risk indicators (36ms)
- ✓ plus 3 additional tests

### components/case-detail/investigation-notes-panel.test.tsx (4 tests)
- ✓ renders investigation notes (50ms)
- ✓ plus 3 additional tests

### components/case-detail/transaction-timeline.test.tsx (5 tests)
- ✓ renders transaction timeline (54ms)
- ✓ plus 4 additional tests

## Failures
None.

## Playwright / E2E
No Playwright configuration file (`playwright.config.ts`) or E2E spec files (`*.spec.ts`) exist in the project. E2E tests were not executed.

## Notes
- All `stderr` output during the Vitest run is expected — it comes from tests that intentionally trigger error paths (e.g., "DB down" mock errors for 500-status tests).
- Total duration: 3.98s (transform 471ms, setup 0ms, import 3.76s, tests 201ms, environment 8.72s)
