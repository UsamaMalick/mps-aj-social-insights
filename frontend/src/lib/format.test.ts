import { describe, expect, it } from "vitest";

import {
  formatCompact,
  formatDate,
  formatHour,
  formatLabel,
  formatLift,
  formatPercent,
} from "./format";

describe("format", () => {
  it("formats large numbers compactly", () => {
    expect(formatCompact(12_400)).toBe("12.4K");
  });

  it("formats ratios as percentages", () => {
    expect(formatPercent(0.034)).toBe("3.4%");
  });

  it("formats lift with a multiplication sign", () => {
    expect(formatLift(1.857)).toBe("1.86×");
  });

  it("formats dates in UTC", () => {
    expect(formatDate("2026-03-03T23:30:00Z")).toBe("3 Mar 2026");
  });

  it("turns enum values into readable labels", () => {
    expect(formatLabel("human_interest")).toBe("Human interest");
  });

  it("pads hours", () => {
    expect(formatHour(7)).toBe("07:00 UTC");
  });

  it("shows a dash for missing values", () => {
    expect(formatCompact(null)).toBe("—");
    expect(formatPercent(undefined)).toBe("—");
  });
});
