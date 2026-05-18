import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkDesignatedPersons, DESIGNATED_PERSONS_LIST_DATE } from "./sanctions";

describe("checkDesignatedPersons", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns matched=false (stub — integration pending)", () => {
    const result = checkDesignatedPersons(["Test Name"]);
    expect(result.matched).toBe(false);
    expect(result.matchedNames).toHaveLength(0);
  });

  it("returns the correct list date", () => {
    const result = checkDesignatedPersons(["Test Name"]);
    expect(result.listDate).toBe(DESIGNATED_PERSONS_LIST_DATE);
  });

  it("includes a warning about pending integration", () => {
    const result = checkDesignatedPersons(["Test Name"]);
    expect(result.warning).toBeDefined();
    expect(result.warning).toContain("not yet integrated");
  });

  it("logs a warning (without PII) on each call", () => {
    checkDesignatedPersons(["Test Name"]);
    expect(console.warn).toHaveBeenCalledOnce();
    // Verify PII is not logged — the log should say [REDACTED]
    const warnArg = (console.warn as ReturnType<typeof vi.spyOn>).mock.calls[0][0] as string;
    expect(warnArg).toContain("REDACTED");
    expect(warnArg).not.toContain("Test Name");
  });

  it("handles an empty names array without throwing", () => {
    expect(() => checkDesignatedPersons([])).not.toThrow();
  });
});
