// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { InvestigationNotesPanel } from "./investigation-notes-panel";
import type { CaseNote } from "@/lib/types";

const notes: CaseNote[] = [
  {
    id: "note-2",
    noteType: "TRANSACTION_REVIEW",
    author: "analyst@bank.com",
    content: "Reviewed linked transactions — rapid movement pattern confirmed.",
    createdAt: "2026-04-02T14:30:00Z",
  },
  {
    id: "note-1",
    noteType: "CUSTOMER_PROFILE_REVIEW",
    author: "analyst@bank.com",
    content: "Customer profile reviewed. High-risk corporate entity.",
    createdAt: "2026-04-01T10:00:00Z",
  },
  {
    id: "note-3",
    noteType: "DECISION_RATIONALE",
    author: "reviewer@bank.com",
    content: "Suspicion established. Recommend filing STR.",
    createdAt: "2026-04-03T09:00:00Z",
  },
];

describe("InvestigationNotesPanel", () => {
  it("renders notes in chronological order — oldest first (AC1)", () => {
    render(<InvestigationNotesPanel notes={notes} />);
    const cards = screen.getAllByTestId("note-card");
    expect(cards).toHaveLength(3);

    // First card should be note-1 (2026-04-01 — oldest)
    expect(within(cards[0]).getByText(/Customer profile reviewed/)).toBeDefined();
    // Second card should be note-2 (2026-04-02)
    expect(within(cards[1]).getByText(/rapid movement pattern/)).toBeDefined();
    // Third card should be note-3 (2026-04-03 — newest)
    expect(within(cards[2]).getByText(/Recommend filing STR/)).toBeDefined();
  });

  it("displays note type, author, content, and creation timestamp (AC2)", () => {
    render(<InvestigationNotesPanel notes={[notes[1]]} />);
    const card = screen.getByTestId("note-card");

    // Note type
    const typeEl = within(card).getByTestId("note-type");
    expect(typeEl.textContent).toBe("Customer Profile Review");

    // Author
    const authorEl = within(card).getByTestId("note-author");
    expect(authorEl.textContent).toBe("analyst@bank.com");

    // Content
    expect(within(card).getByText("Customer profile reviewed. High-risk corporate entity.")).toBeDefined();

    // Timestamp
    const tsEl = within(card).getByTestId("note-timestamp");
    expect(tsEl.textContent).toBeTruthy();
  });

  it("shows empty state with prompt to add first note (AC3)", () => {
    render(<InvestigationNotesPanel notes={[]} />);
    const empty = screen.getByTestId("notes-empty");
    expect(empty.textContent).toContain("Add the first investigation note");
    expect(screen.queryAllByTestId("note-card")).toHaveLength(0);
  });

  it("displays note count in header", () => {
    render(<InvestigationNotesPanel notes={notes} />);
    expect(screen.getByText("Investigation Notes (3)")).toBeDefined();
  });
});
