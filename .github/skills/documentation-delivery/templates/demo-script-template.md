# Demo Script — AML/STR Case Management Platform

> 5-10 minute walkthrough for C-level audience. Focus: business value + AI-powered development.

---

## Opening (30 seconds)

**Show:** Dashboard at `/dashboard`
**Say:** "This is a fully functional AML case management platform, built entirely with AI-assisted development in [X hours]. It handles the full STR lifecycle — from alert to filing — under Thailand's AMLA B.E. 2542 compliance requirements."

---

## 1. Dashboard Overview (1 minute)

**Show:** Dashboard stats cards + activity feed
**Say:** "The MLRO sees real-time operational risk — open cases, high-risk flags, pending STR filings, and recent activity. Everything updates live."

**Click:** A case in the activity feed → navigates to case detail

---

## 2. Case Investigation (2 minutes)

**Show:** Case detail page for AML-2026-0017
**Say:** "This is an active investigation — a corporate import/export account showing structuring patterns. The analyst sees the full picture: customer profile, risk score, flagged transactions, and investigation notes."

**Highlight:**
- Transaction timeline with flagged entries
- Risk score calculation
- Investigation notes with timestamps

---

## 3. STR Filing (2 minutes)

**Show:** Click "File STR" button
**Say:** "When suspicion is established, the MLRO initiates an STR filing. The form is pre-filled from investigation data — reducing manual entry and errors."

**Walk through:**
- Pre-filled subject details
- Transaction summary
- Suspicion grounds
- Submit with confirmation

**Say:** "Filed within the 7-day regulatory deadline, reported to AMLO."

---

## 4. Security & Compliance (1 minute)

**Say:** "Every action is audit-logged. Role-based access ensures only authorized users can approve filings. The platform prevents tipping off — customers never see investigation status."

**Show:** Audit log / access control demonstration

---

## 5. How It Was Built (2 minutes)

**Say:** "This was built using an agentic development pipeline with GitHub Copilot. 10 specialized AI agents — architect, engineers, security reviewer, test runner — each with enforced boundaries. The security reviewer is read-only at the platform level. Every AI action is audit-logged — the same principle we apply to the AML platform itself."

**Show:** (optional) Agent pipeline diagram, audit.jsonl

---

## Closing

**Key Metrics:**
- Stories delivered: X
- Unit test coverage: X%
- E2E scenarios passing: X
- Security findings: 0 critical
- Development time: [X hours with AI vs estimated Y without]
