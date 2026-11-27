import { describe, expect, it } from "vitest";

import { preferredLocale } from "./proxy";

describe("preferredLocale", () => {
  it("picks Arabic when the browser prefers it", () => {
    expect(preferredLocale("ar-QA,ar;q=0.9,en;q=0.8")).toBe("ar");
  });

  it("respects quality weights", () => {
    expect(preferredLocale("fr;q=1,en;q=0.5,ar;q=0.8")).toBe("ar");
  });

  it("falls back to English", () => {
    expect(preferredLocale("fr-FR,de;q=0.7")).toBe("en");
    expect(preferredLocale(null)).toBe("en");
  });
});
