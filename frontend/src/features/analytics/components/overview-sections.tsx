import { EmptyState } from "@/components/data/empty-state";
import { Figure } from "@/components/data/figure";
import { interpolate } from "@/i18n/interpolate";
import { getI18n } from "@/i18n/server";

import {
  getAccountSummaries,
  getContentGaps,
  getHighlights,
  getOverviewTotals,
  getTopPosts,
} from "../api";
import { briefingHeadline } from "../briefing";
import { ContentGapNote } from "./content-gap-note";
import { RankedAccounts } from "./ranked-accounts";
import { TopPostsList } from "./top-posts-list";
import { WhatsWorking } from "./whats-working";

const STANDOUT_POSTS = 6;

export async function BriefingLeadSection() {
  const [{ locale, t, fmt }, totals, highlights] = await Promise.all([
    getI18n(),
    getOverviewTotals(),
    getHighlights(),
  ]);
  if (totals.own_posts === 0) {
    return <EmptyState title={t.briefing.emptyTitle} description={t.briefing.emptyBody} />;
  }
  return (
    <section aria-label={t.briefing.summaryLabel} className="space-y-10">
      <h1 className="font-serif text-display max-w-4xl tracking-tight text-balance">
        {briefingHeadline(locale, t, fmt, totals, highlights)}
      </h1>
      <div className="border-rule sm:divide-rule grid gap-8 border-y py-8 sm:grid-cols-3 sm:gap-0 sm:divide-x">
        <div className="sm:pe-8">
          <Figure
            label={t.briefing.postsLabel}
            value={totals.own_posts}
            format="integer"
            locale={locale}
            note={t.briefing.postsNote}
          />
        </div>
        <div className="sm:px-8">
          <Figure
            label={t.briefing.engagementLabel}
            value={totals.own_median_engagement_score}
            format="percent"
            locale={locale}
            aside={interpolate(t.briefing.engagementAside, {
              value: fmt.percent(totals.competitor_median_engagement_score),
            })}
            note={t.briefing.engagementNote}
          />
        </div>
        <div className="sm:ps-8">
          <Figure
            label={t.briefing.reachLabel}
            value={totals.own_reach}
            format="compact"
            locale={locale}
            note={t.briefing.reachNote}
          />
        </div>
      </div>
    </section>
  );
}

export async function BriefingAccountsSection() {
  const [i18n, rows] = await Promise.all([getI18n(), getAccountSummaries()]);
  return <RankedAccounts rows={rows} i18n={i18n} />;
}

export async function BriefingInsightsSection() {
  const [i18n, highlights, gaps] = await Promise.all([
    getI18n(),
    getHighlights(),
    getContentGaps(),
  ]);
  return (
    <div className="space-y-8">
      <WhatsWorking highlights={highlights} i18n={i18n} />
      <ContentGapNote gaps={gaps} i18n={i18n} />
    </div>
  );
}

export async function BriefingTopPostsSection() {
  const [i18n, posts] = await Promise.all([getI18n(), getTopPosts(STANDOUT_POSTS)]);
  return <TopPostsList posts={posts} i18n={i18n} />;
}
