import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { Recommendation } from "../types";
import { ReviewList } from "./review-list";

const setRecommendationStatus = vi.fn<(id: string, status: string) => Promise<void>>();
const toast = vi.fn();

vi.mock("../actions", () => ({
  setRecommendationStatus: (id: string, status: string) => setRecommendationStatus(id, status),
}));
vi.mock("sonner", () => ({
  toast: Object.assign((...args: unknown[]) => toast(...args), { error: vi.fn() }),
}));

const RECOMMENDATION: Recommendation = {
  id: "rec-1",
  title: "Make more reel posts",
  suggestion: "Reels earn more.",
  category: "format",
  status: "new",
  source: "template",
  prompt_version: "t",
  model: "template",
  created_at: "2026-11-27T10:00:00Z",
  title_ar: "انشروا مزيدًا من منشورات الريلز",
  suggestion_ar: "تحقق منشورات الريلز تفاعلًا أعلى.",
  evidence: {
    metric: "engagement_score",
    dimension: "media_type",
    segment: "reel",
    baseline: "other posts from the same account",
    segment_value: 0.0085,
    baseline_value: 0.0047,
    lift: 1.78,
    sample_size: 910,
    baseline_sample_size: 3139,
    snapshot_hours: 72,
    own_share: null,
    competitor_share: null,
    notes: null,
  },
};

describe("ReviewList", () => {
  beforeEach(() => {
    setRecommendationStatus.mockReset().mockResolvedValue(undefined);
    toast.mockReset();
  });

  it("accepting hides the card while saving, then offers Undo", async () => {
    let finishSaving = () => {};
    setRecommendationStatus.mockImplementationOnce(
      () => new Promise<void>((resolve) => (finishSaving = resolve)),
    );
    render(<ReviewList recommendations={[RECOMMENDATION]} removeOnReview locale="en" />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /accept/i }));
    });
    // Optimistic: gone before the server answers (afterwards the refreshed list omits it).
    expect(screen.queryByText("Make more reel posts")).not.toBeInTheDocument();
    expect(setRecommendationStatus).toHaveBeenCalledWith("rec-1", "accepted");

    await act(async () => finishSaving());
    const [message, options] = toast.mock.calls[0] as [string, { action: { onClick: () => void } }];
    expect(message).toBe("Accepted: Make more reel posts");

    options.action.onClick();
    expect(setRecommendationStatus).toHaveBeenLastCalledWith("rec-1", "new");
  });

  it("shows no review buttons on already-reviewed recommendations", () => {
    render(
      <ReviewList
        recommendations={[{ ...RECOMMENDATION, status: "accepted" }]}
        removeOnReview={false}
        locale="en"
      />,
    );

    expect(screen.queryByRole("button", { name: /accept/i })).not.toBeInTheDocument();
  });

  it("shows Arabic wording and Arabic toasts on Arabic pages", async () => {
    render(<ReviewList recommendations={[RECOMMENDATION]} removeOnReview locale="ar" />);

    expect(screen.getByText("انشروا مزيدًا من منشورات الريلز")).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /قبول/ }));
    });

    const [message, options] = toast.mock.calls[0] as [string, { action: { label: string } }];
    expect(message).toBe("تم القبول: انشروا مزيدًا من منشورات الريلز");
    expect(options.action.label).toBe("تراجع");
  });
});
