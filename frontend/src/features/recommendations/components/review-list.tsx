"use client";

import { Check, X } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { setRecommendationStatus } from "../actions";
import type { Recommendation, RecommendationStatus } from "../types";
import { RecommendationCard } from "./recommendation-card";

type Decision = Exclude<RecommendationStatus, "new">;
const DECISION_LABELS: Record<Decision, string> = { accepted: "Accepted", dismissed: "Dismissed" };

interface ReviewListProps {
  recommendations: Recommendation[];
  /** Cards leave the list as soon as they're reviewed (the "New" tab). */
  removeOnReview: boolean;
}

/** Accept/dismiss update the list instantly; a toast offers Undo for a few seconds. */
export function ReviewList({ recommendations, removeOnReview }: ReviewListProps) {
  const [, startTransition] = useTransition();
  const [visible, hide] = useOptimistic(recommendations, (current, id: string) =>
    current.filter((r) => r.id !== id),
  );

  function review(recommendation: Recommendation, decision: Decision) {
    startTransition(async () => {
      if (removeOnReview) hide(recommendation.id);
      try {
        await setRecommendationStatus(recommendation.id, decision);
      } catch (error) {
        console.error("Could not update recommendation", error);
        toast.error("Couldn’t save that decision. Please try again.");
        return;
      }
      toast(`${DECISION_LABELS[decision]}: ${recommendation.title}`, {
        action: {
          label: "Undo",
          onClick: () => {
            void setRecommendationStatus(recommendation.id, "new");
          },
        },
      });
    });
  }

  return (
    <div>
      {visible.map((recommendation) => (
        <RecommendationCard
          key={recommendation.id}
          recommendation={recommendation}
          actions={
            recommendation.status === "new" ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => review(recommendation, "accepted")}>
                  <Check aria-hidden /> Accept
                </Button>
                <Button variant="ghost" onClick={() => review(recommendation, "dismissed")}>
                  <X aria-hidden /> Dismiss
                </Button>
              </div>
            ) : null
          }
        />
      ))}
    </div>
  );
}
