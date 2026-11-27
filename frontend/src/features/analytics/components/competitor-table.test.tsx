import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { direction } from "@/i18n/config";
import type { I18n } from "@/i18n/server";
import { createFormat } from "@/lib/format";

import type { CompetitorComparison } from "../types";

const i18n = (locale: Locale): I18n => ({
  locale,
  dir: direction(locale),
  t: getDictionary(locale),
  fmt: createFormat(locale),
});
import { CompetitorTable } from "./competitor-table";

const ROW: CompetitorComparison = {
  account: {
    id: "a1",
    platform: "instagram",
    handle: "rival",
    display_name: "Rival News",
    is_own: false,
    followers_count: 1_000_000,
  },
  post_count: 300,
  median_engagement_score: 0.0042,
  median_likes: 3_500,
  median_comments: 300,
  median_shares: 450,
  median_views: 60_000,
  posts_per_day: 3.4,
};

describe("CompetitorTable", () => {
  it("shows public metrics only", () => {
    render(<CompetitorTable rows={[ROW]} i18n={i18n("en")} />);

    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent);
    expect(headers).toContain("Median likes");
    expect(headers).toContain("Median views");
    expect(headers.join(" ")).not.toMatch(/reach|clicks|saves/i);
  });

  it("formats values for reading", () => {
    render(<CompetitorTable rows={[ROW]} i18n={i18n("en")} />);

    expect(screen.getByText("Rival News")).toBeInTheDocument();
    expect(screen.getByText("0.42%")).toBeInTheDocument();
    expect(screen.getByText("60K")).toBeInTheDocument();
  });

  it("uses Arabic headers and still shows public metrics only", () => {
    render(<CompetitorTable rows={[ROW]} i18n={i18n("ar")} />);

    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent);
    expect(headers).toContain("وسيط الإعجابات");
    expect(headers).toContain("وسيط المشاهدات");
    expect(headers.join(" ")).not.toMatch(/الوصول|النقرات|الحفظ/);
  });
});
