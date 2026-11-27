import { describe, expect, it } from "vitest";

import { direction, isLocale, switchLocalePath } from "./config";

describe("i18n config", () => {
  it("recognises supported languages only", () => {
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("is right-to-left for Arabic", () => {
    expect(direction("ar")).toBe("rtl");
    expect(direction("en")).toBe("ltr");
  });

  it("switches language while keeping the page and its filters", () => {
    expect(switchLocalePath("/en/posts", "?media=reel&post=1", "ar")).toBe(
      "/ar/posts?media=reel&post=1",
    );
    expect(switchLocalePath("/ar", "", "en")).toBe("/en");
    expect(switchLocalePath("/posts", "", "ar")).toBe("/ar/posts");
    expect(switchLocalePath("/", "", "ar")).toBe("/ar");
  });
});
