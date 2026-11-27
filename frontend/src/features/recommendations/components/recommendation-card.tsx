import { Check, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate, formatLabel } from "@/lib/format";

import { setRecommendationStatus } from "../actions";
import type { Recommendation } from "../types";
import { EvidencePanel } from "./evidence-panel";

const SOURCE_LABELS = { llm: "AI-written", template: "Template" } as const;

interface RecommendationCardProps {
  recommendation: Recommendation;
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const { id, status } = recommendation;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{formatLabel(recommendation.category)}</Badge>
          {recommendation.evidence.own_share != null ? (
            <Badge variant="outline">Content gap</Badge>
          ) : null}
        </div>
        <CardTitle className="text-lg">{recommendation.title}</CardTitle>
        <CardDescription>
          {SOURCE_LABELS[recommendation.source]} · {formatDate(recommendation.created_at)}
        </CardDescription>
        {status !== "new" ? (
          <CardAction>
            <Badge variant={status === "accepted" ? "default" : "outline"}>
              {formatLabel(status)}
            </Badge>
          </CardAction>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed">{recommendation.suggestion}</p>
        <EvidencePanel evidence={recommendation.evidence} />
      </CardContent>
      {status === "new" ? (
        <CardFooter className="gap-2">
          <form action={setRecommendationStatus.bind(null, id, "accepted")}>
            <Button type="submit" size="sm">
              <Check aria-hidden /> Accept
            </Button>
          </form>
          <form action={setRecommendationStatus.bind(null, id, "dismissed")}>
            <Button type="submit" size="sm" variant="outline">
              <X aria-hidden /> Dismiss
            </Button>
          </form>
        </CardFooter>
      ) : null}
    </Card>
  );
}
