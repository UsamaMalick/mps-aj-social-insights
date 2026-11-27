import Link from "next/link";

import { Caption } from "@/components/data/caption";
import { EmptyState } from "@/components/data/empty-state";
import { formatCompact, formatDate, formatLabel, formatLift, formatPercent } from "@/lib/format";

import { LIFT_HINT } from "../metrics";
import type { TopPost } from "../types";

interface TopPostsListProps {
  posts: TopPost[];
}

export function TopPostsList({ posts }: TopPostsListProps) {
  return (
    <section aria-labelledby="top-posts-heading" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="top-posts-heading" className="font-serif text-title">
          Standout posts
        </h2>
        <p className="eyebrow">{LIFT_HINT}</p>
      </div>
      {posts.length === 0 ? (
        <EmptyState title="No posts yet" description="Load the sample dataset with `make seed`." />
      ) : (
        <ol className="divide-rule border-rule grid divide-y border-y md:grid-cols-2 md:divide-y-0">
          {posts.map((post, index) => (
            <li
              key={post.post_id}
              className="border-rule md:border-b md:odd:border-e md:odd:pe-6 md:even:ps-6 [&:nth-last-child(-n+2)]:md:border-b-0"
            >
              <Link
                href={`/posts?post=${post.post_id}`}
                className="group hover:bg-paper-2/60 focus-visible:ring-ring -mx-3 grid grid-cols-[auto_1fr] gap-x-4 rounded-md px-3 py-5 transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
              >
                <span className="font-serif text-ink-2 text-3xl leading-none">{index + 1}</span>
                <div className="min-w-0 space-y-2">
                  <p className="eyebrow">
                    {post.account_display_name} · {formatLabel(post.platform)} ·{" "}
                    {formatLabel(post.media_type)} · {formatDate(post.posted_at)}
                  </p>
                  <Caption
                    text={post.caption}
                    className="line-clamp-3 text-[0.9375rem] leading-relaxed group-hover:underline group-hover:decoration-rule-strong group-hover:underline-offset-4"
                  />
                  <p className="text-ink-2 tabular flex flex-wrap gap-x-4 text-xs">
                    <span>
                      <span className="text-ink font-semibold">{formatLift(post.lift)}</span> its
                      account&rsquo;s median
                    </span>
                    <span>{formatPercent(post.engagement_score)} engagement</span>
                    <span>{formatCompact(post.views)} views</span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
