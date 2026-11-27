import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatLabel, formatLift, formatPercent } from "@/lib/format";

import type { ContentGap } from "../types";

interface ContentGapsCardProps {
  gaps: ContentGap[];
}

export function ContentGapsCard({ gaps }: ContentGapsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Content gaps</CardTitle>
        <CardDescription>
          Formats and story types competitors use far more often than Al Jazeera, and that
          outperform other posts.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {gaps.length === 0 ? (
          <p className="text-muted-foreground text-sm">No clear gaps found.</p>
        ) : (
          <ul className="space-y-3">
            {gaps.map((gap) => (
              <li key={`${gap.dimension}-${gap.segment}`} className="space-y-1 text-sm">
                <p className="font-medium">
                  {formatLabel(gap.segment)}{" "}
                  <span className="text-muted-foreground font-normal">
                    ({formatLabel(gap.dimension)})
                  </span>
                </p>
                <p className="text-muted-foreground tabular-nums">
                  Al Jazeera {formatPercent(gap.own_share)} of posts · competitors{" "}
                  {formatPercent(gap.competitor_share)} · {formatLift(gap.lift_vs_rest)} vs other
                  posts
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
