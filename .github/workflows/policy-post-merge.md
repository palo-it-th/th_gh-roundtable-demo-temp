---
on:
  pull_request:
    types: [closed]
description: >
  Post-merge quality gate and stakeholder notification for policy change PRs.
  Triggers when a policy/* branch is merged to main. Runs the full quality
  suite (Vitest, Next.js build, Playwright E2E) and posts a compliance
  confirmation to the linked GitHub Discussion.
permissions:
  contents: read
  pull-requests: read
  discussions: read
  issues: read
concurrency:
  group: policy-post-merge-${{ github.event.pull_request.number }}
  cancel-in-progress: false
safe-outputs:
  add-comment:
    max: 5
engine: copilot
timeout-minutes: 30
tools:
  bash: true
  github:
    toolsets: [repos, issues, discussions, pull_requests]
---

# Policy Post-Merge Quality Gate and Notification

## Guard

Exit cleanly if either condition is true:
- The PR was closed without being merged (`pull_request.merged != true`).
- The head branch does **not** match the pattern `policy/*`.

If the guard passes, proceed with the steps below.

---

## Step 1: Extract Policy Context

1. Parse the head branch name (`policy/<YYYY-MM-DD>-<slug>`) to derive the
   analysis directory: `docs/policy-state/policy-analysis/<YYYY-MM-DD>-<slug>/`.
2. Read `analysis.md` from that directory. Extract:
   - Affected regulation sections (quote identifiers verbatim)
   - The effective date or compliance deadline (if present)
   - The one-sentence regulatory action summary
3. Read the PR body to get the policy URL and the story-to-code-change checklist.

---

## Step 2: Run Quality Gates

Run the following in order. Capture pass/fail counts and any error summaries
for inclusion in the compliance report.

```bash
npm ci
npm run test
npm run build
```

If Playwright spec files exist under `tests/e2e/`, also run:

```bash
npx playwright test --reporter=list
```

Collect:
- Vitest: total tests, passed, failed, duration
- Build: success or first compiler error line
- Playwright: total specs, passed, failed (omit if no specs exist)

If any gate fails, skip Steps 3–4 and go directly to **Failure Handling**.

---

## Step 3: Record Merge State

Using `safe-outputs.add-comment`, post a brief state update to the triggering PR
(or the linked issue if identifiable) with:
- Merge timestamp
- Branch name
- Quality gate outcome summary

---

## Step 4: Post Compliance Confirmation

Find the GitHub Discussion in category **reports** whose title contains both
`[policy-analysis]` and the slug from the branch name (or the PR title).

Post a new comment to that Discussion with the following structure:

---

**Policy change merged and verified — PR #<N>**

**Merge details**
- PR: #<N> — <PR title>
- Merged by: @<actor>
- Merged at: <timestamp>

**Quality gate results**
| Gate | Result | Detail |
|------|--------|--------|
| Vitest unit tests | Pass | <X> passed / <Y> total (<duration>s) |
| Next.js build | Pass | Compiled successfully |
| Playwright E2E | Pass / No E2E specs | <X> passed |

**Affected regulation sections**
<quote section identifiers from analysis.md>

**Effective date / compliance deadline**
<value from analysis.md, or "Not specified">

**Recommended compliance team actions**
1. Notify the MLRO that the code changes are now live on `main`.
2. Update the internal compliance calendar with the effective date above.
3. If STR filing logic was changed (`app/api/str/` or `components/reports/`),
   schedule a filing review with the Compliance Technology team.
4. Archive this Discussion link in the regulatory change register.

---

## Failure Handling

If any quality gate fails:

1. Post a failure comment to the Discussion (same lookup as Step 4):

---

**Post-merge quality gate FAILED — PR #<N>**

The following gates failed after merging `policy/<YYYY-MM-DD>-<slug>` to `main`:

| Gate | Result | Error |
|------|--------|-------|
| <gate name> | Fail | <first error line> |

**Recommended action:** An engineer must fix the failures on `main` or revert
the merge. Tag this Discussion with `needs-fix` until resolved.

---

2. Use `safe-outputs.add-comment` on the PR to summarise the failure for the next reviewer, explicitly requesting a fix or revert.
