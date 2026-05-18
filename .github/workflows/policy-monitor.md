---
on:
  schedule: daily
  workflow_dispatch:
description: >
  Monitors Bank of Thailand and AMLO websites for new or updated content
  covering AML/CFT regulations, enforcement actions, and compliance
  developments for Thai commercial banks. Fetches each page, computes a
  SHA256 hash of its body text, compares with the hash stored in
  docs/policy-state/policy-hashes.json, and creates a GitHub Issue if new
  or changed content is detected.
permissions:
  contents: read
  issues: read
concurrency:
  group: policy-pipeline
  cancel-in-progress: false
safe-outputs:
  create-issue:
    title-prefix: "[policy-update] "
    labels: [policy-change, needs-analysis]
    max: 1
    close-older-issues: true
  create-pull-request:
    title-prefix: "[policy-cache] "
    labels: [automation]
    draft: false
    if-no-changes: ignore
engine: copilot
timeout-minutes: 15
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
    toolsets: [repos, issues]
---

# Policy Monitor Agent

Crawl Bank of Thailand (BOT) and AMLO Thailand websites, discover new
content relevant to AML/CFT compliance and Thai banking regulation,
deep-fetch each page, and signal both new content and revised content.

**Configured entry points**:
- https://www.bot.or.th/en/our-roles/financial-institutions/financial-institutions-and-financial-service-providers-policy.html
- https://www.amlo.go.th/index.php/en/
- https://app.bot.or.th/FIPCS/eng/PFIPCS_list.aspx
- https://www.bot.or.th/en/news-and-media/news.html

## Topics of interest

Process content covering these topics. Record skipped items in
`seen_items` so we don't re-evaluate them, but do not file issues:

- BOT notifications, circulars, and guidelines for commercial banks
- AMLO regulations, enforcement actions, or penalties
- Changes to AML/CFT frameworks, requirements, or thresholds under AMLA B.E. 2542
- Financial crime — money laundering, scam detection, fraud prevention
- Sanctions or licensing decisions affecting Thai banks
- KYC/CDD guideline changes
- Joint BOT/AMLO press releases and advisories

Skip: content about monetary policy rates, investment products, corporate
earnings, or market data unless they explicitly reference a regulatory
action, enforcement outcome, or AML/CFT requirement change.

## Instructions

1. Read `docs/policy-state/policy-hashes.json` from the working tree. Sections:
   - `seen_items` — array of page URLs previously processed
   - `items` — per-item state (title, published_date, body_sha256, checked_at)
   - `index_checked_at` — last successful index fetch
   If the file is missing, this is a **bootstrap run**: record
   discovered content and their state, but do NOT file any issues.

2. **Tier 1 — Listing page discovery**:
   a. Use `web-fetch` to retrieve all four entry points:
      - https://www.bot.or.th/en/our-roles/financial-institutions/financial-institutions-and-financial-service-providers-policy.html
      - https://www.amlo.go.th/index.php/en/
      - https://app.bot.or.th/FIPCS/eng/PFIPCS_list.aspx
      - https://www.bot.or.th/en/news-and-media/news.html
   b. Parse each listing to extract every content card: link href, title,
      category tag, teaser text, and publication date. Resolve relative
      hrefs against the respective base URL (`https://www.bot.or.th`
      or `https://www.amlo.go.th`).
   c. Follow pagination (if a "load more" or next-page link exists)
      only until content pre-dates `index_checked_at`.
   d. Filter to in-scope topics (see above). When in doubt, include.
   e. Diff against `seen_items`:
      - **NEW URLs** → tier 2 with `signal=new`
      - **Existing URLs** → tier 2 with `signal=revisit`

3. **Tier 2 — Content page** (for each item from tier 1):
   a. Fetch the full page HTML with `web-fetch`.
   b. Extract metadata: title, author, published date, last updated date,
      category. Record what's present.
   c. Extract the body text — strip navigation, advertisements,
      related-content widgets, and social share buttons. Capture only
      substantive content.
   d. Hash the normalised body text:
      ```bash
      echo "<body-text>" | tr -s '[:space:]' ' ' | sha256sum
      ```
   e. Compare `body_sha256` against `items[<url>].body_sha256`
      (only meaningful on `revisit` — a changed hash means the content
      was updated after initial publication).

4. **Issue creation** — group all signals into ONE issue
   (`max: 1`, `close-older-issues: true`):
   - Title: `[policy-update] <N> new, <M> updated — <date>`
   - Body sections:
     - **Newly discovered content**: bullet list with URL, title,
       published date, category, and one-sentence teaser
     - **Updated content**: per-item note that body text changed,
       including old and new `checked_at` timestamps
     - **Content URLs** for every in-scope item, so the orchestrator
       can fetch and analyse them directly without re-parsing the index
     - Footer: instruction to trigger the orchestrator workflow

5. Update `docs/policy-state/policy-hashes.json`:
   - Add new URLs to `seen_items`
   - Update `items[<url>]` entries with new `body_sha256`, `title`,
     `published_date`, and `checked_at`
   - Set `index_checked_at` to now
   - Skip updates for any resource that failed to fetch/parse —
     never advance a hash on a failed fetch
   Submit changes via `create-pull-request` with commit message
   `chore(policy): update hash cache <date>`.

6. If nothing changed and no new content, log a summary and exit
   cleanly. Do not invoke any safe-outputs.
