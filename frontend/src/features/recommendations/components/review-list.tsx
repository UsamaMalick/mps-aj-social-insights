"use client";

import { Check, X } from "lucide-react";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { interpolate } from "@/i18n/interpolate";

import { setRecommendationStatus } from "../actions";
import type { Recommendation, RecommendationStatus } from "../types";
import { RecommendationCard } from "./recommendation-card";

type Decision = Exclude<RecommendationStatus, "new">;

interface ReviewListProps {
  recommendations: Recommendation[];
  /** Cards leave the list as soon as they're reviewed (the "New" tab). */
  removeOnReview: boolean;
  locale: Locale;
}

/** Accept/dismiss update the list instantly; a toast offers Undo for a few seconds. */
export function ReviewList({ recommendations, removeOnReview, locale }: ReviewListProps) {
  const t = getDictionary(locale).recommendations;
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
        toast.error(t.saveFailed);
        return;
      }
      const title =
        locale === "ar" && recommendation.title_ar ? recommendation.title_ar : recommendation.title;
      const message = decision === "accepted" ? t.acceptedToast : t.dismissedToast;
      toast(interpolate(message, { title }), {
        action: {
          label: t.undo,
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
          locale={locale}
          actions={
            recommendation.status === "new" ? (
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => review(recommendation, "accepted")}>
                  <Check aria-hidden /> {t.accept}
                </Button>
                <Button variant="ghost" onClick={() => review(recommendation, "dismissed")}>
                  <X aria-hidden /> {t.dismiss}
                </Button>
              </div>
            ) : null
          }
        />
      ))}
    </div>
  );
}
