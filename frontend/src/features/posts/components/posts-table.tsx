import { Caption } from "@/components/data/caption";
import { type Column, DataTable } from "@/components/data/data-table";
import { formatCompact, formatDate, formatLabel, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { PostListItem } from "../types";

const COLUMNS: Column<PostListItem>[] = [
  {
    key: "post",
    header: "Post",
    className: "min-w-80 max-w-xl whitespace-normal",
    cell: (post) => (
      <div className="space-y-1.5">
        <p className="eyebrow">
          <span className={cn(post.account.is_own && "text-ink")}>{post.account.display_name}</span>{" "}
          · {formatLabel(post.platform)} · {formatDate(post.posted_at)}
        </p>
        <Caption text={post.caption} className="line-clamp-2 leading-relaxed" />
      </div>
    ),
  },
  {
    key: "kind",
    header: "Format · story",
    cell: (post) => (
      <span className="text-ink-2 whitespace-nowrap">
        {formatLabel(post.media_type)}
        {post.labels ? ` · ${formatLabel(post.labels.story_type)}` : ""}
        {" · "}
        {post.language.toUpperCase()}
      </span>
    ),
  },
  {
    key: "likes",
    header: "Likes",
    align: "end",
    cell: (p) => formatCompact(p.latest_snapshot?.likes),
  },
  {
    key: "comments",
    header: "Comments",
    align: "end",
    cell: (p) => formatCompact(p.latest_snapshot?.comments),
  },
  {
    key: "shares",
    header: "Shares",
    align: "end",
    cell: (p) => formatCompact(p.latest_snapshot?.shares),
  },
  {
    key: "views",
    header: "Views",
    align: "end",
    cell: (p) => formatCompact(p.latest_snapshot?.views),
  },
  {
    key: "score",
    header: "Engagement",
    align: "end",
    cell: (p) => <span className="font-medium">{formatPercent(p.engagement_score)}</span>,
  },
];

interface PostsTableProps {
  posts: PostListItem[];
  postHref: (postId: string) => string;
}

export function PostsTable({ posts, postHref }: PostsTableProps) {
  return (
    <DataTable
      caption="Posts with metrics at their latest snapshot; select a row for details"
      columns={COLUMNS}
      rows={posts}
      rowKey={(post) => post.id}
      rowHref={(post) => postHref(post.id)}
    />
  );
}
