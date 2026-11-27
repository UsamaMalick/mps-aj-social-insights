import { describe, expect, it } from "vitest";

import { pageItems } from "./pagination";

describe("pageItems", () => {
  it("shows first, last and the current neighbourhood with gaps", () => {
    expect(pageItems(5, 20)).toEqual([1, "gap", 4, 5, 6, "gap", 20]);
  });

  it("only adds a gap where pages are actually skipped", () => {
    expect(pageItems(1, 4)).toEqual([1, 2, "gap", 4]);
    expect(pageItems(2, 3)).toEqual([1, 2, 3]);
  });

  it("handles a single page", () => {
    expect(pageItems(1, 1)).toEqual([1]);
  });
});
