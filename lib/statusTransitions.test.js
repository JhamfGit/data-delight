import { describe, it, expect } from "vitest";
import { allowedFrom, canTransition } from "./statusTransitions.js";

describe("statusTransitions", () => {
  describe("allowedFrom", () => {
    it("returns ['SI'] for a registro currently NO", () => {
      expect(allowedFrom("NO")).toEqual(["SI"]);
    });

    it("returns ['NO'] for a registro currently SI", () => {
      expect(allowedFrom("SI")).toEqual(["NO"]);
    });

    it("returns an empty array for an unknown/unmapped status, never throws", () => {
      expect(() => allowedFrom("FAILED")).not.toThrow();
      expect(allowedFrom("FAILED")).toEqual([]);
    });
  });

  describe("canTransition", () => {
    it("allows NO -> SI", () => {
      expect(canTransition("NO", "SI")).toBe(true);
    });

    it("allows SI -> NO", () => {
      expect(canTransition("SI", "NO")).toBe(true);
    });

    it("rejects NO -> NO (not in the transition table)", () => {
      expect(canTransition("NO", "NO")).toBe(false);
    });

    it("rejects any transition from an unknown source status, never throws", () => {
      expect(() => canTransition("FAILED", "SI")).not.toThrow();
      expect(canTransition("FAILED", "SI")).toBe(false);
    });
  });
});
