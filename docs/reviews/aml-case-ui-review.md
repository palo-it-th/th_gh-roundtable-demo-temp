# UI Review: Batch 6 — Reviewer Decision & Filing Status Forms (+ Overall Application)

## Summary

- **Design doc:** `DESIGN.md` (CodeCademy dark theme)
- **Components reviewed:** `reviewer-decision-form.tsx`, `filing-status-form.tsx` (new); cross-referenced with `decision-form.tsx`, `note-form.tsx` (existing)
- **Pages verified:** `/` (dashboard), `/cases` (list), `/cases/[id]` (detail), API routes
- **Overall: Issues found** — no Critical blockers; 2 Medium accessibility issues and 4 Low issues

---

## Smoke Check Results

| Check | Status | Notes |
|-------|--------|-------|
| Build (`npx next build`) | ✅ Pass | Compiled successfully in 2.1s, TypeScript clean, 0 errors |
| Route `/` | ✅ 200 | Dashboard renders |
| Route `/cases` | ✅ 200 | Case table renders |
| Route `/cases/[id]` | ✅ 200 | All panels render, including new forms (client-side conditional) |
| Route `/api/cases` | ✅ 200 | JSON response |
| Route `/api/dashboard/summary` | ✅ 200 | JSON response |
| Role-based form visibility | ✅ No flicker | SSR renders null (role defaults to "Analyst"), hydration matches; forms appear only on role switch to "Reviewer" — no layout shift or flash |
| `data-testid` coverage | ✅ Complete | All interactive elements in both new forms have test IDs |
| Loading/error feedback | ✅ Present | Both forms show inline errors, submitting states, and success messages |

---

## Design Alignment (DESIGN.md)

| Design Element | Expected | Actual | Status |
|---------------|----------|--------|--------|
| Card container | `#1E293B` fill, `1px #334155` border, `4px` radius | `bg-card`, `border-card-border`, `rounded-md` (6px) | ⚠️ `rounded-md` = 6px, DESIGN.md Cards = 4px (`radius-md`). Consistent with ALL existing panels — not a new regression |
| Input styling | `#334155` border, `#0F172A` fill, `4px` radius | `border-card-border`, `bg-surface-base`, `rounded` (4px) | ✅ Match |
| Input focus | `#4ADE80` border, `shadow-focus` ring | `focus:border-primary` present, `focus:outline-none` removes default — **no shadow-focus ring** | ⚠️ Pre-existing (all forms) |
| Primary button | `#4ADE80` fill, `#0F172A` text, hover `#22C55E` | `bg-primary text-surface-base hover:bg-primary-hover` | ✅ Match |
| Secondary button (Return) | transparent, `#60A5FA` text, `1px #60A5FA` border | `bg-transparent text-text-secondary border-card-border` | ⚠️ Uses gray instead of blue. See [3] |
| Disabled state | `0.35` opacity, `disabled` cursor | `disabled:opacity-35 disabled:cursor-not-allowed` | ✅ Match |
| Typography — headings | Fira Code, bold | `font-mono text-base font-bold` | ✅ Match |
| Typography — labels | Inter, 13–14px, medium | `text-sm font-medium` (14px) | ✅ Acceptable |
| Colors — all tokens | No hardcoded hex values | 0 hardcoded hex values in new forms | ✅ Clean |
| Tertiary highlight (analyst summary) | `#FB923C` | `border-tertiary/40 bg-tertiary/10 text-tertiary` | ✅ Match |

---

## Color Contrast Audit (WCAG 2.1 AA)

| Combination | Ratio | Requirement | Status |
|------------|-------|-------------|--------|
| `text-primary` (#F1F5F9) on `card` (#1E293B) | 13.35:1 | 4.5:1 | ✅ Pass |
| `text-secondary` (#94A3B8) on `card` (#1E293B) | 5.71:1 | 4.5:1 | ✅ Pass |
| `text-error` (#F87171) on `card` (#1E293B) | 5.29:1 | 4.5:1 | ✅ Pass |
| `tertiary` (#FB923C) on `card` (#1E293B) | 6.46:1 | 4.5:1 | ✅ Pass |
| `primary` (#4ADE80) on `surface-base` (#0F172A) | 10.25:1 | 4.5:1 | ✅ Pass |
| `text-muted` (#64748B) on `surface-base` (#0F172A) — placeholder only | 3.75:1 | 3:1 (placeholder) | ✅ Pass (placeholder exempt from 4.5:1) |

All text colors in the new forms pass WCAG AA. The `text-text-muted` usage is limited to `placeholder:` pseudo-class, which is non-essential per WCAG guidelines.

---

## Issues (by severity)

### [1] No `aria-describedby` linking error messages to form inputs

- **Severity:** Medium
- **Element:** All form inputs in `reviewer-decision-form.tsx` and `filing-status-form.tsx`
- **Expected:** Error messages should be programmatically associated with inputs via `aria-describedby` (WCAG 2.1 SC 1.3.1), and `aria-invalid` should be set on errored inputs
- **Actual:** Error `<p>` elements render below inputs but have no `id` attribute and are not linked via `aria-describedby`. Inputs lack `aria-invalid`. Screen readers will not announce validation errors when focus returns to the field.
- **Scope:** This is a pre-existing pattern — `note-form.tsx` and `decision-form.tsx` also lack `aria-describedby`. The new forms are **consistent** with the existing codebase but all forms share this gap.
- **Fix:**
  ```tsx
  <textarea
    id="reviewer-comment"
    aria-describedby={errors.reviewerComment ? "reviewer-comment-error" : undefined}
    aria-invalid={!!errors.reviewerComment}
    ...
  />
  {errors.reviewerComment && (
    <p id="reviewer-comment-error" role="alert" className="...">
      {errors.reviewerComment}
    </p>
  )}
  ```

### [2] Success messages not announced to screen readers (`aria-live` missing)

- **Severity:** Medium
- **Element:** `reviewer-decision-form.tsx:185–190`, `filing-status-form.tsx:237–242`
- **Expected:** Dynamic status messages should use `aria-live="polite"` for screen reader announcement
- **Actual:** Success messages (`"Case approved for STR filing"`, `"Filing status updated successfully"`) render as plain `<span>` elements. Screen readers will not announce these.
- **Scope:** Same pattern in `note-form.tsx` and `decision-form.tsx` — pre-existing.
- **Fix:** Add `aria-live="polite"` to the success message container, or wrap in a persistent `aria-live` region.

### [3] "Return for More Info" button deviates from DESIGN.md Secondary button spec

- **Severity:** Low
- **Element:** `reviewer-decision-form.tsx:175–179`
- **Expected:** DESIGN.md Secondary button: `transparent fill, #60A5FA text, 1px #60A5FA border, hover #1E293B`
- **Actual:** Button uses `bg-transparent text-text-secondary border-card-border hover:bg-surface-editor` — gray text (#94A3B8) and gray border (#334155) instead of blue
- **Fix:** Use `text-secondary border-secondary hover:bg-card` for the Return button, or treat it as a Ghost variant (transparent, `#94A3B8` text, no border) per DESIGN.md

### [4] `ReviewerDecisionForm` wraps in `<div>` while all other forms use `<form>`

- **Severity:** Low
- **Element:** `reviewer-decision-form.tsx:84` — `<div>` wrapper
- **Expected:** Consistent `<form>` wrapper pattern (used by `note-form.tsx`, `decision-form.tsx`, `filing-status-form.tsx`)
- **Actual:** `ReviewerDecisionForm` uses a `<div>` wrapper because it has two distinct action buttons (Approve / Return) rather than a single submit. The buttons use `onClick` handlers. While functionally correct, this means:
  - No native form validation
  - Enter key won't trigger submission
  - Inconsistent with other forms in the codebase
- **Fix:** Either wrap in `<form>` with a hidden submit or accept the `<div>` as intentional given the dual-action design. Low priority.

### [5] Native `type="date"` input may render with light-theme picker on dark background

- **Severity:** Low
- **Element:** `filing-status-form.tsx:199–210` — `<input type="date">`
- **Expected:** Date picker should respect dark theme
- **Actual:** No `color-scheme: dark` is set in CSS. Most modern browsers (Chrome, Safari) will render the date picker widget with a light theme calendar popover against the dark background. The input field itself is styled correctly.
- **Fix:** Add `color-scheme: dark;` to `:root` in `globals.css`.

### [6] Input focus removes outline but does not add `shadow-focus` ring

- **Severity:** Low
- **Element:** All inputs in both new forms
- **Expected:** DESIGN.md specifies `shadow-focus: 2px ring #4ADE80 at 40%` for focused inputs
- **Actual:** Inputs use `focus:border-primary focus:outline-none` — the border changes to green, but no ring/shadow is applied. The green border alone provides 10.25:1 contrast against the background, so visibility is adequate. Pre-existing pattern across all forms.
- **Fix:** Add `focus:ring-2 focus:ring-primary/40` alongside the border change.

---

## Positive Observations

1. **Exact consistency with existing forms** — class patterns, spacing (`p-5`, `mt-4`, `space-y-4`, `gap-3`), typography (`font-mono text-base font-bold`), and disabled states match `note-form.tsx` and `decision-form.tsx` identically
2. **Design token discipline** — zero hardcoded hex values in either new form; all colors reference semantic tokens from `globals.css`
3. **Complete `data-testid` coverage** — every interactive element has a unique test ID: `reviewer-approve-button`, `reviewer-return-button`, `reviewer-comment-textarea`, `filing-status-select`, `filing-reference-input`, `filing-date-input`, `filing-submit-button`
4. **Clean conditional rendering** — both forms check `role` and `caseStatus` before rendering; analyst recommendation summary only shows when `decision` exists
5. **Error clearing on input change** — both forms clear field-specific errors as the user types, preventing stale validation state
6. **`encodeURIComponent` on API URLs** — `caseId` is properly encoded in both `fetch()` calls
7. **Proper submitting states** — buttons show "Approving…", "Returning…", "Updating…" text and are disabled during submission; this prevents double-submit
8. **Filing form conditionally reveals FILED fields** — `filingReference` and `filedAt` inputs only appear when status is `FILED`, reducing form complexity for other statuses
9. **Analyst recommendation summary panel** — the tertiary-highlighted summary in `ReviewerDecisionForm` gives reviewers immediate context about the analyst's assessment, following good UX practice
10. **Overall application cohesion** — the dark theme is consistently applied across all pages (dashboard, case list, case detail); card structure, spacing, and typography form a visually cohesive system

---

## Summary Table

| Severity | Count | Blocks Pipeline? |
|----------|-------|-----------------|
| Critical | 0 | — |
| High | 0 | — |
| Medium | 2 | No (both are pre-existing accessibility patterns, consistent across all forms) |
| Low | 4 | No |

**Verdict:** The Batch 6 forms are well-implemented and visually consistent with the existing application. No Critical or High issues found. The 2 Medium accessibility findings (`aria-describedby` and `aria-live`) are pre-existing patterns shared by all forms — they should be addressed in a dedicated accessibility sweep rather than blocking this batch. The overall application maintains strong visual cohesion with the dark theme design system.
