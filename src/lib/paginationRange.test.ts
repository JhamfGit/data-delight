import { describe, it, expect } from "vitest";
import { getPaginationRange } from "./paginationRange";

describe("getPaginationRange", () => {
  it("returns an empty range when there are no pages", () => {
    expect(getPaginationRange(1, 0)).toEqual([]);
  });

  it("lists every page when the total fits within the visible window", () => {
    expect(getPaginationRange(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPaginationRange(3, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it("shows a right-side ellipsis when the current page is near the start", () => {
    expect(getPaginationRange(1, 20)).toEqual([1, 2, "…", 20]);
    expect(getPaginationRange(2, 20)).toEqual([1, 2, 3, "…", 20]);
  });

  it("shows a left-side ellipsis when the current page is near the end", () => {
    expect(getPaginationRange(20, 20)).toEqual([1, "…", 19, 20]);
    expect(getPaginationRange(19, 20)).toEqual([1, "…", 18, 19, 20]);
  });

  it("shows both ellipses with the current page centered when it's in the middle", () => {
    expect(getPaginationRange(10, 20)).toEqual([1, "…", 9, 10, 11, "…", 20]);
  });

  it("never returns a page number below 1 or above totalPages", () => {
    const range = getPaginationRange(1, 20).filter((item): item is number => typeof item === "number");
    expect(Math.min(...range)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...range)).toBeLessThanOrEqual(20);
  });
});
