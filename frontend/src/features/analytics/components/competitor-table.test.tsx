import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { CompetitorComparison } from "../types";
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
    render(<CompetitorTable rows={[ROW]} />);

    const headers = screen.getAllByRole("columnheader").map((h) => h.textContent);
    expect(headers).toContain("Median likes");
    expect(headers).toContain("Median views");
    expect(headers.join(" ")).not.toMatch(/reach|clicks|saves/i);
  });

  it("formats values for reading", () => {
    render(<CompetitorTable rows={[ROW]} />);

    expect(screen.getByText("Rival News")).toBeInTheDocument();
    expect(screen.getByText("0.42%")).toBeInTheDocument();
    expect(screen.getByText("60K")).toBeInTheDocument();
  });
});
