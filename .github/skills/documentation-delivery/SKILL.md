---
name: documentation-delivery
description: Generate project README, demo walkthrough script, known limitations, and PR summary for the AML case management platform. Use when creating documentation or preparing a pull request.
---

# Documentation Delivery

## Artifacts to Produce

1. **README.md** — project documentation (use template)
2. **docs/demo-script.md** — C-level demo walkthrough (use template)
3. **PR description** — summary for the pull request

## README Guidelines

- Start with a clear one-line description
- Include screenshots/GIFs of key screens if available
- Getting started must work on a fresh clone (prerequisites, install, seed, run)
- Document all environment variables needed
- Include test commands

## Demo Script Guidelines

- Designed for 5-10 minute C-level presentation
- Focus on business value, not technical details
- Each step has: what to show, what to say, what to click
- Include "wow moments" that demonstrate AI capabilities
- End with key metrics (code coverage, stories delivered, etc.)

## PR Summary Format

```markdown
## Summary
[1-2 sentences on what this delivers]

## Stories Delivered
- T-01: [title] ✅
- T-02: [title] ✅

## Key Decisions
- [Decision 1]: [rationale]

## Test Results
- Unit: X passed
- E2E: X passed

## Known Limitations
- [Limitation 1]
```
