// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RiskIndicatorsList } from "./risk-indicators-list";

const indicators = [
  "Rapid pass-through of funds",
  "High-risk jurisdiction counterparty",
  "Structuring patterns detected",
];

describe("RiskIndicatorsList", () => {
  it("displays all risk indicators as a list (AC1)", () => {
    render(<RiskIndicatorsList indicators={indicators} />);
    const items = screen.getAllByTestId("risk-indicator");
    expect(items).toHaveLength(3);
  });

  it("each indicator is clearly labeled (AC2)", () => {
    render(<RiskIndicatorsList indicators={indicators} />);
    const items = screen.getAllByTestId("risk-indicator");

    expect(items[0].textContent).toContain("Rapid pass-through of funds");
    expect(items[1].textContent).toContain("High-risk jurisdiction counterparty");
    expect(items[2].textContent).toContain("Structuring patterns detected");
  });

  it("shows empty state when no indicators (AC3)", () => {
    render(<RiskIndicatorsList indicators={[]} />);
    const empty = screen.getByTestId("risk-indicators-empty");
    expect(empty.textContent).toBe("No risk indicators.");
    expect(screen.queryAllByTestId("risk-indicator")).toHaveLength(0);
  });

  it("displays header", () => {
    render(<RiskIndicatorsList indicators={indicators} />);
    expect(screen.getByText("Risk Indicators")).toBeDefined();
  });
});
