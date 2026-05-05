// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { TransactionTimeline } from "./transaction-timeline";
import type { CaseTransaction } from "@/lib/types";

const txBase: CaseTransaction = {
  id: "tx-1",
  direction: "INCOMING",
  amount: 50000,
  currency: "SGD",
  counterparty: "Global Trade Co",
  country: "Singapore",
  date: "2026-03-15T10:00:00Z",
  purpose: "Trade Payment",
};

const transactions: CaseTransaction[] = [
  { ...txBase, id: "tx-3", date: "2026-03-17T10:00:00Z", direction: "OUTGOING", amount: 30000, counterparty: "Offshore Ltd", country: "Cayman Islands", purpose: "Transfer" },
  { ...txBase, id: "tx-1", date: "2026-03-15T10:00:00Z" },
  { ...txBase, id: "tx-2", date: "2026-03-16T10:00:00Z", direction: "OUTGOING", amount: 20000, counterparty: "Shell Corp", country: "BVI", purpose: "Investment" },
];

describe("TransactionTimeline", () => {
  it("renders transactions in chronological order (AC1)", () => {
    render(<TransactionTimeline transactions={transactions} />);
    const rows = screen.getAllByTestId("transaction-row");
    expect(rows).toHaveLength(3);

    // First row should be tx-1 (earliest date: 2026-03-15)
    expect(within(rows[0]).getByText("Global Trade Co")).toBeDefined();
    // Second row should be tx-2 (2026-03-16)
    expect(within(rows[1]).getByText("Shell Corp")).toBeDefined();
    // Third row should be tx-3 (2026-03-17)
    expect(within(rows[2]).getByText("Offshore Ltd")).toBeDefined();
  });

  it("displays all required fields: direction, amount+currency, counterparty, country, date, purpose (AC2)", () => {
    render(<TransactionTimeline transactions={[txBase]} />);
    const row = screen.getByTestId("transaction-row");

    // Direction badge
    const badge = within(row).getByTestId("transaction-direction");
    expect(badge.textContent).toBe("IN");

    // Amount with currency (SGD 50,000.00 formatted)
    expect(within(row).getByText(/50,000/)).toBeDefined();

    // Counterparty
    expect(within(row).getByText("Global Trade Co")).toBeDefined();

    // Country
    expect(within(row).getByText("Singapore")).toBeDefined();

    // Purpose and date in the detail line
    expect(within(row).getByText(/Trade Payment/)).toBeDefined();
  });

  it("visually distinguishes incoming and outgoing transactions (AC3)", () => {
    const mixed: CaseTransaction[] = [
      { ...txBase, id: "in-1", direction: "INCOMING" },
      { ...txBase, id: "out-1", direction: "OUTGOING", date: "2026-03-16T10:00:00Z" },
    ];
    render(<TransactionTimeline transactions={mixed} />);
    const badges = screen.getAllByTestId("transaction-direction");

    expect(badges[0].textContent).toBe("IN");
    expect(badges[0].className).toContain("bg-[#0F2E1F]");

    expect(badges[1].textContent).toBe("OUT");
    expect(badges[1].className).toContain("bg-[#2D1215]");
  });

  it("shows empty state when no transactions (AC4)", () => {
    render(<TransactionTimeline transactions={[]} />);
    const empty = screen.getByTestId("transaction-empty");
    expect(empty.textContent).toBe("No transactions recorded.");
    expect(screen.queryAllByTestId("transaction-row")).toHaveLength(0);
  });

  it("displays correct transaction count in header", () => {
    render(<TransactionTimeline transactions={transactions} />);
    expect(screen.getByText("Transactions (3)")).toBeDefined();
  });
});
