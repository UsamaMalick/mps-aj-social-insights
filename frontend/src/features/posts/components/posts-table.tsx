import { Caption } from "@/components/data/caption";
import { type Column, DataTable } from "@/components/data/data-table";
import { Badge } from "@/components/ui/badge";
import { formatCompact, formatDate, formatLabel, formatPercent } from "@/lib/format";

import type { PostListItem } from "../types";

const COLUMNS: Column<PostListItem>[] = [
  {
    key: "posted",
    header: "Posted",
    cell: (post) => <span className="whitespace-nowrap">{formatDate(post.posted_at)}</span>,
  },
  {
    key: "account",
    header: "Account",
    cell: (post) => (
      <div className="flex flex-col gap-1">
        <span className="font-medium whitespace-nowrap">{post.account.display_name}</span>
        <span className="text-muted-foreground text-xs">
          {formatLabel(post.platform)} · {post.account.is_own ? "Own" : "Competitor"}
        </span>
      </div>
    ),
  },
  {
    key: "caption",
    header: "Caption",
    className: "min-w-72 max-w-md whitespace-normal",
    cell: (post) => <Caption text={post.caption} className="line-clamp-3" />,
  },
  {
    key: "labels",
    header: "Format · story",
    cell: (post) => (
      <div className="flex flex-wrap gap-1">
        <Badge variant="secondary">{formatLabel(post.media_type)}</Badge>
        {post.labels ? (
          <Badge variant="outline">{formatLabel(post.labels.story_type)}</Badge>
        ) : null}
        <Badge variant="outline">{post.language.toUpperCase()}</Badge>
      </div>
    ),
  },
  {
    key: "likes",
    header: "Likes",
    align: "end",
    cell: (post) => formatCompact(post.latest_snapshot?.likes),
  },
  {
    key: "comments",
    header: "Comments",
    align: "end",
    cell: (post) => formatCompact(post.latest_snapshot?.comments),
  },
  {
    key: "shares",
    header: "Shares",
    align: "end",
    cell: (post) => formatCompact(post.latest_snapshot?.shares),
  },
  {
    key: "views",
    header: "Views",
    align: "end",
    cell: (post) => formatCompact(post.latest_snapshot?.views),
  },
  {
    key: "score",
    header: "Engagement",
    align: "end",
    cell: (post) => formatPercent(post.engagement_score),
  },
];

interface PostsTableProps {
  posts: PostListItem[];
}

export function PostsTable({ posts }: PostsTableProps) {
  return (
    <DataTable
      caption="Posts with metrics at their latest snapshot"
      columns={COLUMNS}
      rows={posts}
      rowKey={(post) => post.id}
    />
  );
}
