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
import { METRIC_LABELS, OWN_ONLY_METRICS, PUBLIC_METRICS } from "@/features/analytics/metrics";
import { formatCompact, formatDate, formatLabel, formatPercent } from "@/lib/format";

import type { PostDetail } from "../types";

interface PostDrawerProps {
  post: PostDetail;
  closeHref: string;
}

/** Post details in a side sheet. Open state lives in the URL (?post=), so it's shareable. */
export function PostDrawer({ post, closeHref }: PostDrawerProps) {
  const router = useRouter();
  const [early, final] = [post.snapshots.at(0), post.snapshots.at(-1)];

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) router.replace(closeHref, { scroll: false });
      }}
    >
      <SheetContent
        side="right"
        className="bg-paper border-rule w-full gap-0 overflow-y-auto shadow-none sm:max-w-lg"
      >
        <SheetHeader className="border-rule space-y-1 border-b p-6">
          <p className="eyebrow">
            {post.account.display_name} · {formatLabel(post.platform)} ·{" "}
            {formatDate(post.posted_at)}
          </p>
          <SheetTitle className="font-serif text-2xl font-normal">
            {formatLabel(post.media_type)}
            {post.labels ? ` · ${formatLabel(post.labels.story_type)}` : ""}
          </SheetTitle>
          <SheetDescription className="sr-only">Post caption, metrics and labels</SheetDescription>
        </SheetHeader>

        <div className="space-y-8 p-6">
          <Caption text={post.caption} className="text-base leading-relaxed" />

          <section aria-labelledby="drawer-metrics" className="space-y-3">
            <h3 id="drawer-metrics" className="eyebrow">
              Metrics after 24h and 72h
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-rule text-ink-2 border-b">
                  <th scope="col" className="py-2 text-start font-normal" />
                  <th scope="col" className="py-2 text-end font-normal">
                    24h
                  </th>
                  <th scope="col" className="py-2 text-end font-normal">
                    72h
                  </th>
                </tr>
              </thead>
              <tbody className="divide-rule divide-y">
                {PUBLIC_METRICS.map((metric) => (
                  <tr key={metric}>
                    <th scope="row" className="py-2 text-start font-normal">
                      {METRIC_LABELS[metric]}
                    </th>
                    <td className="tabular py-2 text-end">{formatCompact(early?.[metric])}</td>
                    <td className="tabular py-2 text-end font-medium">
                      {formatCompact(final?.[metric])}
                    </td>
                  </tr>
                ))}
                {post.account.is_own
                  ? OWN_ONLY_METRICS.map((metric) => (
                      <tr key={metric}>
                        <th scope="row" className="py-2 text-start font-normal">
                          {METRIC_LABELS[metric]}
                          <span className="eyebrow ms-2">own only</span>
                        </th>
                        <td className="tabular py-2 text-end">{formatCompact(early?.[metric])}</td>
                        <td className="tabular py-2 text-end font-medium">
                          {formatCompact(final?.[metric])}
                        </td>
                      </tr>
                    ))
                  : null}
              </tbody>
            </table>
            <p className="text-ink-2 text-sm">
              Engagement at the latest snapshot:{" "}
              <span className="text-ink font-medium tabular">
                {formatPercent(post.engagement_score)}
              </span>
            </p>
          </section>

          {post.labels ? (
            <section aria-labelledby="drawer-labels" className="space-y-3">
              <h3 id="drawer-labels" className="eyebrow">
                Labels
              </h3>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {(["topic", "region", "story_type", "hook_style", "tone"] as const).map((key) => (
                  <div key={key}>
                    <dt className="text-ink-2">{formatLabel(key)}</dt>
                    <dd>{formatLabel(post.labels?.[key])}</dd>
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
            Open on {formatLabel(post.platform)} <ExternalLink className="size-3.5" aria-hidden />
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
