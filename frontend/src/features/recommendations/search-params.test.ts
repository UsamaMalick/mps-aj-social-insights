import { describe, expect, it } from "vitest";

import { parseStatus } from "./search-params";

describe("parseStatus", () => {
  it("defaults to new recommendations", () => {
    expect(parseStatus({})).toBe("new");
  });

  it("accepts known statuses and 'all'", () => {
    expect(parseStatus({ status: "accepted" })).toBe("accepted");
    expect(parseStatus({ status: "all" })).toBeUndefined();
  });

  it("falls back to new for unknown values", () => {
    expect(parseStatus({ status: "archived" })).toBe("new");
  });
});
