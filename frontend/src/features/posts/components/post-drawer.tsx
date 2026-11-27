"use client";

import { ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

import { Caption } from "@/components/data/caption";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { OWN_ONLY_METRICS, PUBLIC_METRICS } from "@/features/analytics/metrics";
import { direction, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { interpolate } from "@/i18n/interpolate";
import { enumLabel } from "@/i18n/labels";
import { createFormat } from "@/lib/format";

import type { PostDetail } from "../types";

interface PostDrawerProps {
  post: PostDetail;
  closeHref: string;
  locale: Locale;
}

/** Post details in a side sheet. Open state lives in the URL (?post=), so it's shareable. */
export function PostDrawer({ post, closeHref, locale }: PostDrawerProps) {
  const router = useRouter();
  const t = getDictionary(locale);
  const fmt = createFormat(locale);
  const [early, final] = [post.snapshots.at(0), post.snapshots.at(-1)];

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) router.replace(closeHref, { scroll: false });
      }}
    >
      <SheetContent
        // Opens from the reading end of the screen: right in English, left in Arabic.
        side={direction(locale) === "rtl" ? "left" : "right"}
        className="bg-paper border-rule w-full gap-0 overflow-y-auto shadow-none sm:max-w-lg"
      >
        <SheetHeader className="border-rule space-y-1 border-b p-6 pe-14">
          <p className="eyebrow">
            {post.account.display_name} · {enumLabel(t, "platform", post.platform)} ·{" "}
            {fmt.date(post.posted_at)}
          </p>
          <SheetTitle className="font-serif text-2xl font-normal">
            {enumLabel(t, "media_type", post.media_type)}
            {post.labels ? ` · ${enumLabel(t, "story_type", post.labels.story_type)}` : ""}
          </SheetTitle>
          <SheetDescription className="sr-only">{t.posts.drawerDescription}</SheetDescription>
        </SheetHeader>

        <div className="space-y-8 p-6">
          <Caption text={post.caption} className="text-base leading-relaxed" />

          <section aria-labelledby="drawer-metrics" className="space-y-3">
            <h3 id="drawer-metrics" className="eyebrow">
              {t.posts.drawerMetrics}
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-rule text-ink-2 border-b">
                  <th scope="col" className="py-2 text-start font-normal" />
                  <th scope="col" className="py-2 text-end font-normal">
                    {t.posts.after24h}
                  </th>
                  <th scope="col" className="py-2 text-end font-normal">
                    {t.posts.after72h}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-rule divide-y">
                {PUBLIC_METRICS.map((metric) => (
                  <tr key={metric}>
                    <th scope="row" className="py-2 text-start font-normal">
                      {t.enums.metric[metric]}
                    </th>
                    <td className="tabular py-2 text-end">{fmt.compact(early?.[metric])}</td>
                    <td className="tabular py-2 text-end font-medium">
                      {fmt.compact(final?.[metric])}
                    </td>
                  </tr>
                ))}
                {post.account.is_own
                  ? OWN_ONLY_METRICS.map((metric) => (
                      <tr key={metric}>
                        <th scope="row" className="py-2 text-start font-normal">
                          {t.enums.metric[metric]}
                          <span className="eyebrow ms-2">{t.posts.ownOnly}</span>
                        </th>
                        <td className="tabular py-2 text-end">{fmt.compact(early?.[metric])}</td>
                        <td className="tabular py-2 text-end font-medium">
                          {fmt.compact(final?.[metric])}
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
            <p className="text-ink-2 text-sm">
              {t.posts.latestEngagement}{" "}
              <span className="text-ink font-medium tabular">
                {fmt.percent(post.engagement_score)}
              </span>
            </p>
          </section>

          {post.labels ? (
            <section aria-labelledby="drawer-labels" className="space-y-3">
              <h3 id="drawer-labels" className="eyebrow">
                {t.posts.drawerLabels}
              </h3>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {(
                  [
                    ["topic", t.posts.labelTopic],
                    ["region", t.posts.labelRegion],
                    ["story_type", t.posts.labelStoryType],
                    ["hook_style", t.posts.labelHookStyle],
                    ["tone", t.posts.labelTone],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <dt className="text-ink-2">{label}</dt>
                    <dd>{enumLabel(t, key, post.labels?.[key])}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ) : null}

          <a
            href={post.url}
            target="_blank"
            rel="noreferrer"
            className="text-ink inline-flex items-center gap-1.5 text-sm underline decoration-rule-strong underline-offset-4 hover:decoration-ink"
          >
            {interpolate(t.posts.openOn, { platform: enumLabel(t, "platform", post.platform) })}{" "}
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
