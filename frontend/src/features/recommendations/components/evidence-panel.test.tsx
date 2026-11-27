import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { Evidence } from "../types";
import { EvidencePanel } from "./evidence-panel";

const EVIDENCE: Evidence = {
  metric: "engagement_score",
  dimension: "story_type",
  segment: "explainer",
  baseline: "other posts from the same account",
  segment_value: 0.0062,
  baseline_value: 0.0048,
  lift: 1.28,
  sample_size: 725,
  baseline_sample_size: 3324,
  snapshot_hours: 72,
  own_share: 0.03,
  competitor_share: 0.22,
  notes: "Compared within 12 accounts.",
};

describe("EvidencePanel", () => {
  it("shows lift, both medians, sample sizes and measurement age", () => {
    render(<EvidencePanel evidence={EVIDENCE} segmentLabel="Explainers" />);

    expect(screen.getByText("1.28×")).toBeInTheDocument();
    expect(screen.getByText("0.62%")).toBeInTheDocument();
    expect(screen.getByText("0.48%")).toBeInTheDocument();
    expect(screen.getByText(/725 posts vs 3,324/)).toBeInTheDocument();
    expect(screen.getByText(/measured 72h after posting/)).toBeInTheDocument();
  });

  it("shows usage shares for content gaps", () => {
    render(<EvidencePanel evidence={EVIDENCE} segmentLabel="Explainers" />);

    expect(screen.getByText(/3% of Al Jazeera posts vs 22% of competitors/)).toBeInTheDocument();
  });

  it("omits usage when the evidence is not a gap", () => {
    render(
      <EvidencePanel
        evidence={{ ...EVIDENCE, own_share: null, competitor_share: null }}
        segmentLabel="Explainers"
      />,
    );

    expect(screen.queryByText(/of Al Jazeera posts/)).not.toBeInTheDocument();
  });
});
