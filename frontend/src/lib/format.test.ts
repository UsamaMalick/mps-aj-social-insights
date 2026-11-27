import { describe, expect, it } from "vitest";

import { createFormat } from "./format";

const en = createFormat("en");
const ar = createFormat("ar");
// Arabic signs carry an invisible right-to-left mark (U+200F) so they sit correctly in RTL.
const visible = (text: string) => text.replace(/[\u200e\u200f]/g, "");

describe("format (English)", () => {
  it("formats large numbers compactly", () => {
    expect(en.compact(12_400)).toBe("12.4K");
  });

  it("keeps two decimals for engagement-sized rates so they line up", () => {
    expect(en.percent(0.005)).toBe("0.50%");
    expect(en.percent(0.0101)).toBe("1.01%");
    expect(en.percent(0.06)).toBe("6.00%");
  });

  it("uses at most one decimal for larger shares", () => {
    expect(en.percent(0.2204)).toBe("22%");
  });

  it("formats lift with a multiplication sign", () => {
    expect(en.lift(1.857)).toBe("1.86×");
  });

  it("formats dates in UTC", () => {
    expect(en.date("2026-03-03T23:30:00Z")).toBe("3 Mar 2026");
  });

  it("shows a dash for missing values", () => {
    expect(en.compact(null)).toBe("—");
    expect(en.percent(undefined)).toBe("—");
  });
});

describe("format (Arabic)", () => {
  it("uses Western digits with Arabic units", () => {
    // Intl joins number and unit with a no-break space so they never wrap apart.
    expect(ar.compact(12_400)).toBe("12.4\u00a0ألف");
    expect(ar.integer(3139)).toBe("3,139");
  });

  it("formats percentages and lift with the same precision as English", () => {
    expect(visible(ar.percent(0.0052))).toBe("0.52%");
    expect(visible(ar.lift(1.78))).toBe("1.78×");
  });

  it("puts a right-to-left mark before % and × so they follow the number in Arabic", () => {
    expect(ar.percent(0.0052)).toBe("0.52\u200f%");
    expect(ar.lift(1.78)).toBe("1.78\u200f×");
    expect(en.percent(0.0052)).toBe("0.52%");
  });

  it("formats dates with Arabic month names", () => {
    expect(ar.date("2026-11-14T10:00:00Z")).toBe("14 نوفمبر 2026");
  });
});
