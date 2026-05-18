import { describe, it, expect } from "vitest";
import {
  getJurisdictionRiskIndicator,
  getJurisdictionRiskIndicators,
  getPepRiskIndicator,
  getPolicyRiskIndicators,
} from "./risk-indicators";

describe("getJurisdictionRiskIndicator", () => {
  it("returns null for a non-listed country", () => {
    expect(getJurisdictionRiskIndicator("France")).toBeNull();
  });

  it("returns a Call for Action indicator for Myanmar", () => {
    const indicator = getJurisdictionRiskIndicator("Myanmar");
    expect(indicator).not.toBeNull();
    expect(indicator).toContain("FATF Call for Action");
    expect(indicator).toContain("Myanmar");
  });

  it("returns an Increased Monitoring indicator for Vietnam", () => {
    const indicator = getJurisdictionRiskIndicator("Vietnam");
    expect(indicator).not.toBeNull();
    expect(indicator).toContain("FATF Increased Monitoring");
    expect(indicator).toContain("Vietnam");
  });

  it("includes the list date in the indicator string", () => {
    const indicator = getJurisdictionRiskIndicator("Nigeria");
    expect(indicator).toContain("2026-02-16");
  });
});

describe("getJurisdictionRiskIndicators", () => {
  it("returns an empty array when no countries are on the list", () => {
    const result = getJurisdictionRiskIndicators(["France", "Germany"]);
    expect(result).toHaveLength(0);
  });

  it("returns indicators for listed countries only", () => {
    const result = getJurisdictionRiskIndicators(["France", "Nigeria", "Germany"]);
    expect(result).toHaveLength(1);
    expect(result[0]).toContain("Nigeria");
  });

  it("deduplicates repeated countries", () => {
    const result = getJurisdictionRiskIndicators(["Nigeria", "Nigeria", "Nigeria"]);
    expect(result).toHaveLength(1);
  });

  it("handles mixed blacklist and grey-list countries", () => {
    const result = getJurisdictionRiskIndicators(["Iran", "Vietnam", "Japan"]);
    expect(result).toHaveLength(2);
    expect(result.some((r) => r.includes("Call for Action"))).toBe(true);
    expect(result.some((r) => r.includes("Increased Monitoring"))).toBe(true);
  });
});

describe("getPepRiskIndicator", () => {
  it("returns null when isPep is false", () => {
    expect(getPepRiskIndicator(false)).toBeNull();
  });

  it("returns a PEP indicator string when isPep is true", () => {
    const indicator = getPepRiskIndicator(true);
    expect(indicator).not.toBeNull();
    expect(indicator).toContain("PEP");
    expect(indicator).toContain("EDD required");
  });
});

describe("getPolicyRiskIndicators", () => {
  it("returns empty array when no policy triggers apply", () => {
    const result = getPolicyRiskIndicators({
      transactionCountries: ["Germany", "Japan"],
      isPep: false,
    });
    expect(result).toHaveLength(0);
  });

  it("includes jurisdiction indicator when a FATF country is present", () => {
    const result = getPolicyRiskIndicators({
      transactionCountries: ["Germany", "Myanmar"],
      isPep: false,
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toContain("Call for Action");
  });

  it("includes PEP indicator when isPep is true", () => {
    const result = getPolicyRiskIndicators({
      transactionCountries: ["Germany"],
      isPep: true,
    });
    expect(result).toHaveLength(1);
    expect(result[0]).toContain("PEP");
  });

  it("includes both jurisdiction and PEP indicators when both apply", () => {
    const result = getPolicyRiskIndicators({
      transactionCountries: ["Nigeria", "Vietnam"],
      isPep: true,
    });
    expect(result).toHaveLength(3); // 2 jurisdictions + 1 PEP
  });
});
