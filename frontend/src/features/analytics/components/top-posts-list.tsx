import Link from "next/link";

import { Caption } from "@/components/data/caption";
import { EmptyState } from "@/components/data/empty-state";
import { interpolate } from "@/i18n/interpolate";
import { enumLabel } from "@/i18n/labels";
import type { I18n } from "@/i18n/server";

import type { TopPost } from "../types";

interface TopPostsListProps {
  posts: TopPost[];
  i18n: I18n;
}

export function TopPostsList({ posts, i18n: { locale, t, fmt } }: TopPostsListProps) {
  return (
    <section aria-labelledby="top-posts-heading" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="top-posts-heading" className="font-serif text-title">
          {t.briefing.topHeading}
        </h2>
        <p className="eyebrow">{t.briefing.topMeta}</p>
      </div>
      {posts.length === 0 ? (
        <EmptyState title={t.briefing.topEmptyTitle} description={t.briefing.topEmptyBody} />
      ) : (
        <ol className="divide-rule border-rule grid divide-y border-y md:grid-cols-2 md:divide-y-0">
          {posts.map((post, index) => (
            <li
              key={post.post_id}
              className="border-rule md:border-b md:odd:border-e md:odd:pe-6 md:even:ps-6 [&:nth-last-child(-n+2)]:md:border-b-0"
            >
              <Link
                href={`/${locale}/posts?post=${post.post_id}`}
                className="group hover:bg-paper-2/60 focus-visible:ring-ring -mx-3 grid grid-cols-[auto_1fr] gap-x-4 rounded-md px-3 py-5 transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
              >
                <span className="font-serif text-ink-2 text-3xl leading-none">
                  {fmt.integer(index + 1)}
                </span>
                <div className="min-w-0 space-y-2">
                  <p className="eyebrow">
                    {post.account_display_name} · {enumLabel(t, "platform", post.platform)} ·{" "}
                    {enumLabel(t, "media_type", post.media_type)} · {fmt.date(post.posted_at)}
                  </p>
                  <Caption
                    text={post.caption}
                    className="group-hover:decoration-rule-strong line-clamp-3 text-[0.9375rem] leading-relaxed group-hover:underline group-hover:underline-offset-4"
                  />
                  <p className="text-ink-2 tabular flex flex-wrap gap-x-4 text-xs">
                    <span className="text-ink font-semibold">
                      {interpolate(t.briefing.topLift, { lift: fmt.lift(post.lift) })}
                    </span>
                    <span>
                      {interpolate(t.briefing.topEngagement, {
                        value: fmt.percent(post.engagement_score),
                      })}
                    </span>
                    <span>
                      {interpolate(t.briefing.topViews, { value: fmt.compact(post.views) })}
                    </span>
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
