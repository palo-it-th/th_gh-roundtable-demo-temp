import { describe, it, expect } from "vitest";
import {
  requiresEdd,
  getFatfStatus,
  requiresEddForAny,
} from "./edd-checks";

describe("requiresEdd", () => {
  it("returns required=false for a country not on any FATF list", () => {
    const result = requiresEdd("Germany");
    expect(result.required).toBe(false);
    expect(result.reasons).toHaveLength(0);
  });

  it("returns required=true for a Call for Action country (Iran)", () => {
    const result = requiresEdd("Iran");
    expect(result.required).toBe(true);
    expect(result.reasons[0]).toContain("Call for Action");
    expect(result.reasons[0]).toContain("Iran");
  });

  it("returns required=true for North Korea (DPRK) by name", () => {
    const result = requiresEdd("North Korea");
    expect(result.required).toBe(true);
    expect(result.reasons[0]).toContain("Call for Action");
  });

  it("returns required=true for Myanmar (Call for Action)", () => {
    const result = requiresEdd("Myanmar");
    expect(result.required).toBe(true);
    expect(result.reasons[0]).toContain("Call for Action");
  });

  it("returns required=true for a grey-list country (Nigeria)", () => {
    const result = requiresEdd("Nigeria");
    expect(result.required).toBe(true);
    expect(result.reasons[0]).toContain("Increased Monitoring");
    expect(result.reasons[0]).toContain("Nigeria");
  });

  it("returns required=true for Vietnam (grey list)", () => {
    const result = requiresEdd("Vietnam");
    expect(result.required).toBe(true);
    expect(result.reasons[0]).toContain("Increased Monitoring");
  });

  it("handles ISO code lookup for Iran (IR)", () => {
    const result = requiresEdd("IR");
    expect(result.required).toBe(true);
  });

  it("handles ISO code lookup for Nigeria (NG)", () => {
    const result = requiresEdd("NG");
    expect(result.required).toBe(true);
  });

  it("is case-insensitive for country names", () => {
    expect(requiresEdd("nigeria").required).toBe(true);
    expect(requiresEdd("NIGERIA").required).toBe(true);
  });

  it("trims whitespace from input", () => {
    expect(requiresEdd("  Nigeria  ").required).toBe(true);
  });
});

describe("getFatfStatus", () => {
  it("returns onList=false for an unlisted country", () => {
    const result = getFatfStatus("Japan");
    expect(result.onList).toBe(false);
    expect(result.status).toBeNull();
  });

  it("returns CALL_FOR_ACTION status for Iran", () => {
    const result = getFatfStatus("Iran");
    expect(result.onList).toBe(true);
    expect(result.status).toBe("CALL_FOR_ACTION");
    expect(result.listDate).toBe("2026-02-16");
  });

  it("returns INCREASED_MONITORING status for Philippines", () => {
    const result = getFatfStatus("Philippines");
    expect(result.onList).toBe(true);
    expect(result.status).toBe("INCREASED_MONITORING");
  });
});

describe("requiresEddForAny", () => {
  it("returns required=false when no countries are on the list", () => {
    const result = requiresEddForAny(["Germany", "Japan", "Australia"]);
    expect(result.required).toBe(false);
  });

  it("returns required=true when at least one country triggers EDD", () => {
    const result = requiresEddForAny(["Germany", "Nigeria", "Australia"]);
    expect(result.required).toBe(true);
    expect(result.reasons).toHaveLength(1);
  });

  it("accumulates reasons for multiple EDD-triggering countries", () => {
    const result = requiresEddForAny(["Iran", "Nigeria"]);
    expect(result.required).toBe(true);
    expect(result.reasons).toHaveLength(2);
  });

  it("returns required=false for an empty array", () => {
    const result = requiresEddForAny([]);
    expect(result.required).toBe(false);
  });
});
