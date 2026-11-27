import { Caption } from "@/components/data/caption";
import { type Column, DataTable } from "@/components/data/data-table";
import { enumLabel } from "@/i18n/labels";
import type { I18n } from "@/i18n/server";
import { cn } from "@/lib/utils";

import type { PostListItem } from "../types";

function columns({ t, fmt }: I18n): Column<PostListItem>[] {
  return [
    {
      key: "post",
      header: t.posts.columnPost,
      className: "min-w-80 max-w-xl whitespace-normal",
      cell: (post) => (
        <div className="space-y-1.5">
          <p className="eyebrow">
            <span className={cn(post.account.is_own && "text-ink")}>
              {post.account.display_name}
            </span>{" "}
            · {enumLabel(t, "platform", post.platform)} · {fmt.date(post.posted_at)}
          </p>
          <Caption text={post.caption} className="line-clamp-2 leading-relaxed" />
        </div>
      ),
    },
    {
      key: "kind",
      header: t.posts.columnKind,
      cell: (post) => (
        <span className="text-ink-2 whitespace-nowrap">
          {enumLabel(t, "media_type", post.media_type)}
          {post.labels ? ` · ${enumLabel(t, "story_type", post.labels.story_type)}` : ""}
          {" · "}
          {enumLabel(t, "languageCode", post.language)}
        </span>
      ),
    },
    ...(["likes", "comments", "shares", "views"] as const).map((metric): Column<PostListItem> => ({
      key: metric,
      header: t.enums.metric[metric],
      align: "end",
      cell: (p) => fmt.compact(p.latest_snapshot?.[metric]),
    })),
    {
      key: "score",
      header: t.posts.columnEngagement,
      align: "end",
      cell: (p) => <span className="font-medium">{fmt.percent(p.engagement_score)}</span>,
    },
  ];
}

interface PostsTableProps {
  posts: PostListItem[];
  postHref: (postId: string) => string;
  i18n: I18n;
}

export function PostsTable({ posts, postHref, i18n }: PostsTableProps) {
  return (
    <DataTable
      caption={i18n.t.posts.tableCaption}
      columns={columns(i18n)}
      rows={posts}
      rowKey={(post) => post.id}
      rowHref={(post) => postHref(post.id)}
    />
  );
}
