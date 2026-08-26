import { describe, it, expect } from "vitest";
import { allowedFrom, isKnownStatus } from "./statusTransitions";

describe("statusTransitions (frontend UI hint, mirrors lib/statusTransitions.js D2)", () => {
  it("allowedFrom returns the known transitions for NO", () => {
    expect(allowedFrom("NO")).toEqual(["SI"]);
  });

  it("allowedFrom returns the known transitions for SI", () => {
    expect(allowedFrom("SI")).toEqual(["NO"]);
  });

  it("allowedFrom returns an empty array for an unknown status (open vocabulary)", () => {
    expect(allowedFrom("FAILED")).toEqual([]);
  });

  it("isKnownStatus is true for NO and SI", () => {
    expect(isKnownStatus("NO")).toBe(true);
    expect(isKnownStatus("SI")).toBe(true);
  });

  it("isKnownStatus is false for an unmapped value", () => {
    expect(isKnownStatus("FAILED")).toBe(false);
  });
});
