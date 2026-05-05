# Demo 1 — Runbook: From Transcript to Application

Step-by-step guide to run the AML/STR Case Management demo using GitHub Copilot with custom agents, skills, and hooks.

---

## Prerequisites

| Requirement | Check |
|------------|-------|
| Copilot CLI installed | `copilot --version` |
| Project repo initialized | `git init` + initial commit |
| `.github/` folder copied from planning repo | agents, skills, hooks, instructions |
| `docs/reference/aml-domain-knowledge.md` | AML/CFT domain context |
| `DESIGN.md` at project root | Design tokens + visual identity |
| `apm.yml` at project root | External skills manifest |
| Transcript in `docs/` | Business requirements input |

---

## Step 1 — Install Dependencies and Verify Setup

```bash
cd <your-demo-repo>

# Install external skills from apm.yml
apm install

# Launch Copilot CLI
copilot
```

Inside the CLI:

```
/env
```

Confirm you see:
- ✅ `.github/copilot-instructions.md`
- ✅ 10 agents
- ✅ 7 skills
- ✅ Hooks (`pipeline-hooks.json`)

---

## Step 2 — Generate User Stories from Transcript

Select the orchestrator agent:

```
/agent orchestrator
```

Then provide the transcript:

```
Read the business transcript in docs/<your-transcript-file>.md.

Process it into an implementation plan using the user-stories skill:
- Extract actors and capabilities
- Write user stories with acceptance criteria
- Validate each story against INVEST criteria
- Order stories by dependency
- Save to docs/implementation-plan.md

Pause for my review before starting implementation.
```

> **Tip:** This prompt is also available as a reusable prompt file at `.github/prompts/generate-stories.prompt.md`. In VS Code, type `/generate-stories` in Chat to invoke it (requires `"chat.promptFiles": true` in workspace settings).

**What happens:**
1. The `user-stories` skill is auto-loaded (description match)
2. Orchestrator reads the transcript
3. Stories are generated with Given/When/Then acceptance criteria
4. Output saved to `docs/implementation-plan.md`

---

## Step 3 — Human Review (CP-1)

Review `docs/implementation-plan.md`. Check:
- Are the stories correct and complete?
- Is the priority/dependency order sensible?
- Any missing features from the transcript?

Edit the file if needed, then approve:

```
Stories approved. Begin the implementation pipeline — start with the first story.
```

---

## Step 4 — Pipeline Runs (per story)

The orchestrator drives each story through 4 phases:

### Phase 1: Context (parallel)
- **architect** → produces `docs/architecture/aml-case-architecture.md`
- **ui-designer** → produces `docs/design/aml-case-design.md` (reads `DESIGN.md` for tokens)

### Phase 2: Implementation (parallel)
- **backend-engineer** → API routes, services, Prisma schema, tests
- **frontend-engineer** → pages, components, tests (uses `DESIGN.md` via instructions)

Skills auto-loaded during implementation: `code-quality`, `test-execution`, `debugging`

### Phase 3: Quality (sequential)
1. **test-runner** → runs all tests independently (cannot edit code)
2. **code-simplifier** → refactors + re-runs tests
3. **security-advisor** → read-only security review
4. **ui-reviewer** → read-only UI review against `DESIGN.md`

### Phase 4: Human Review (conditional)
- **CP-2** — after first story architecture (review architecture decisions)
- Story marked done → orchestrator picks next story

---

## Step 5 — Human Review (CP-3)

After all stories are complete, the orchestrator triggers a final review:

```
Review docs/reviews/human-review-cp3.md
```

Check the full application state, then approve:

```
Approved. Proceed to documentation delivery.
```

---

## Step 6 — Documentation Delivery

The `documentation-delivery` skill generates:
- `README.md` — project overview, setup, usage
- `docs/demo-script.md` — walkthrough script
- PR summary

---

## Fallback: Manual Agent Switching

If subagent delegation doesn't work automatically, drive each phase manually:

```
# Generate stories
/agent orchestrator
> Read transcript, generate user stories...

# Architecture for story T-01
/new
/agent architect
> Design architecture for story T-01: [title]. Read docs/implementation-plan.md for context...

# UI design for story T-01
/new
/agent ui-designer
> Design UI for story T-01. Read DESIGN.md for design tokens...

# Backend implementation
/new
/agent backend-engineer
> Implement story T-01 based on docs/architecture/aml-case-architecture.md...

# Frontend implementation
/new
/agent frontend-engineer
> Implement story T-01 based on docs/design/aml-case-design.md. Follow DESIGN.md tokens...

# Test verification
/new
/agent test-runner
> Run all tests and report results...

# Code simplification
/new
/agent code-simplifier
> Review and simplify the codebase, re-run tests to verify...

# Security review
/new
/agent security-advisor
> Review the codebase for security issues...

# UI review
/new
/agent ui-reviewer
> Review UI implementation against DESIGN.md and design docs...

# Repeat for next story...
```

---

## Key Files Produced

| File | Produced by | When |
|------|------------|------|
| `docs/implementation-plan.md` | user-stories skill | Step 2 |
| `docs/reviews/human-review-cp1.md` | human-gateway | Step 3 |
| `docs/architecture/aml-case-architecture.md` | architect | Phase 1 |
| `docs/design/aml-case-design.md` | ui-designer | Phase 1 |
| `prisma/schema.prisma` | backend-engineer | Phase 2 |
| `app/**`, `components/**`, `services/**` | engineers | Phase 2 |
| `tests/**` | engineers + test-runner | Phase 2-3 |
| `docs/reviews/human-review-cp2.md` | human-gateway | Phase 4 (first story) |
| `docs/backlog/status.md` | orchestrator | Ongoing |
| `docs/backlog/session-state.md` | orchestrator | Ongoing |
| `logs/audit.jsonl` | hooks (automatic) | Every tool action |
| `docs/reviews/human-review-cp3.md` | human-gateway | Step 5 |
| `README.md` | documentation-delivery | Step 6 |
| `docs/demo-script.md` | documentation-delivery | Step 6 |

---

## Tips

- **Session recovery:** If the session disconnects, relaunch `copilot` and select orchestrator — it reads `docs/backlog/session-state.md` to resume
- **Audit trail:** Every tool action is logged to `logs/audit.jsonl` by the `postToolUse` hook
- **Design consistency:** All frontend agents read `DESIGN.md` via the instruction in `copilot-instructions.md`
- **Domain knowledge:** Agents read `docs/reference/aml-domain-knowledge.md` on demand when working on AML features
