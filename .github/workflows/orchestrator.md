---
on:
  issues:
    types: [labeled]
  workflow_dispatch:
    inputs:
      policy-url:
        description: "Policy URL to analyse (overrides issue body URL)"
        required: false
      skip-fetch:
        description: "Skip re-fetching URL; use issue body content directly"
        default: "false"
description: >
  Full implementation pipeline triggered by a policy-change issue or
  manually. Runs five phases: context, planning, implementation,
  verification, and reporting.
permissions:
  contents: read
  issues: read
  discussions: read
  pull-requests: read
concurrency:
  group: policy-pipeline
  cancel-in-progress: false
safe-outputs:
  create-issue:
    title-prefix: "[analysis] "
    labels: [analysis, in-progress]
  create-discussion:
    category: "reports"
    title-prefix: "[policy-analysis] "
  add-comment:
    max: 10
  create-pull-request:
    base-branch: main
    draft: false
engine: copilot
timeout-minutes: 60
network:
  allowed:
    - www.bot.or.th
    - bot.or.th
    - app.bot.or.th
    - www.amlo.go.th
    - amlo.go.th
tools:
  bash: true
  web-fetch:
  github:
    toolsets: [repos, issues, discussions, pull_requests]
---

# Policy Analysis Orchestrator

Only run if triggered manually OR the issue carries the
`policy-change` label. If the trigger is `issues.labeled` and the
label is anything else, exit cleanly.

You are an AML/STR compliance analyst for a Thai commercial bank. A
regulatory policy change has been detected (or manually triggered).
Execute the five-phase pipeline below, storing outputs as specified
after each phase.

## Context

- Regulatory framework: BOT Notifications & AMLA B.E. 2542 (AML/CFT for banks)
- Codebase: Next.js 15 AML/STR case management platform
- Affected area: compliance workflows, risk scoring, STR filing
- PII rule: do NOT log customer names, account numbers, transaction
  IDs, or any personal data in issue comments, commit messages, or
  discussion posts. Refer only to policy document sections and code
  paths.

---

## Phase 1: Context Gathering

1. Identify the content URL from:
   - The triggering issue body (the monitor lists every in-scope URL), OR
   - The `policy-url` workflow input if manually triggered.
2. Fetch the full page HTML with `web-fetch` to capture metadata
   (title, author, published date, last updated date, category).
3. Extract the body text — strip navigation, advertisements,
   related-content widgets, and social share buttons. Capture only the
   substantive content.
4. Compare against any **previous** committed text in
   `docs/policy-state/policy-analysis/` (if any) to identify what changed
   between the cached version and the current content — do not summarise
   from the teaser or headline alone.
5. Summarise:
   - What regulatory action or policy development the content reports
   - Which specific BOT notifications, AMLO circulars, or enforcement
     actions are mentioned — quote section numbers or notice identifiers
     verbatim from the text
   - Which sections of the relevant regulation are affected, based on
     the reported change
   - The effective date or compliance deadline if stated
6. Save the analysis AND a copy of the extracted text to
   `docs/policy-state/policy-analysis/<YYYY-MM-DD>-<slug>/`:
   - `analysis.md` — your summary
   - `article.txt` — the extracted plain text (for the next run's diff)
   Commit both to the repository.

## Phase 2: Planning

Based on the Phase 1 analysis:

1. Identify which parts of the AML/STR codebase are affected:
   - Risk scoring rules (`lib/risk/`)
   - STR filing logic (`app/api/str/`)
   - Case management workflows (`app/cases/`)
   - Compliance reports (`components/reports/`)
2. Generate user stories in the format:
   `As a [compliance officer/MLRO], I want [feature], so that [benefit].`
3. Produce a prioritised implementation plan in `docs/policy-state/implementation-plan.md`.
4. Comment on the triggering issue with a plan summary.

## Phase 3: Implementation

For each high-priority story from Phase 2:

1. Make the minimum necessary code changes.
2. Follow the project's TypeScript strict mode and Zod validation rules.
3. Add or update Vitest unit tests for changed logic.
4. Do NOT hardcode credentials; use environment variables only.
5. Commit changes to a feature branch named `policy/<YYYY-MM-DD>-<slug>`.
6. Open a pull request using `safe-outputs.create-pull-request`. The PR
   description must include:
   - The policy URL and effective date
   - Affected regulation sections
   - A checklist mapping stories → code changes → tests
7. Do NOT enable auto-merge. The PR must be reviewed by a human.

## Phase 4: Verification

1. Run the existing test suite: `npm run test`
2. Run the build: `npm run build`
3. If Playwright E2E tests exist for affected flows, run them.
4. Report results in a PR comment.
5. If tests fail, attempt up to 2 automatic fix iterations before
   flagging for human review with `safe-outputs.add-comment`. Do not
   force-push or rewrite history.

## Phase 5: Report

1. Create a GitHub Discussion (category: reports) using
   `safe-outputs.create-discussion` with:
   - Executive summary of the policy change
   - Impact assessment (risk level: Low / Medium / High)
   - Implementation actions taken
   - Test results
   - Recommended next steps for the compliance team
2. Link the Discussion from the original issue.
3. Close the issue with a resolution comment.
