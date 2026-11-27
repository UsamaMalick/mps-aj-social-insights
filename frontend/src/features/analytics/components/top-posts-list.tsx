import { ExternalLink } from "lucide-react";

import { Caption } from "@/components/data/caption";
import { EmptyState } from "@/components/data/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatAccountName,
  formatCompact,
  formatDate,
  formatLabel,
  formatLift,
  formatPercent,
} from "@/lib/format";

import { LIFT_HINT } from "../metrics";
import type { TopPost } from "../types";

interface TopPostsListProps {
  posts: TopPost[];
}

export function TopPostsList({ posts }: TopPostsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top posts</CardTitle>
        <CardDescription>Highest lift across all accounts. {LIFT_HINT}.</CardDescription>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <EmptyState title="No posts yet" description="Run `make seed` to load sample data." />
        ) : (
          <ol className="divide-y">
            {posts.map((post) => (
              <li key={post.post_id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-medium">
                    {formatAccountName(post.account_display_name, post.platform)}
                  </span>
                  {post.is_own ? <Badge>Own</Badge> : <Badge variant="outline">Competitor</Badge>}
                  <Badge variant="secondary">{formatLabel(post.media_type)}</Badge>
                  {post.labels ? (
                    <Badge variant="secondary">{formatLabel(post.labels.story_type)}</Badge>
                  ) : null}
                  <span className="text-muted-foreground">{formatDate(post.posted_at)}</span>
                </div>
                <Caption text={post.caption} className="line-clamp-2 text-sm" />
                <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs tabular-nums">
                  <span>
                    <strong className="text-foreground">{formatLift(post.lift)}</strong> lift
                  </span>
                  <span>{formatPercent(post.engagement_score)} engagement</span>
                  <span>{formatCompact(post.likes)} likes</span>
                  <span>{formatCompact(post.views)} views</span>
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:text-foreground inline-flex items-center gap-1 underline-offset-2 hover:underline"
                  >
                    Open <ExternalLink className="size-3" aria-hidden />
                    <span className="sr-only">post on {formatLabel(post.platform)}</span>
                  </a>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
