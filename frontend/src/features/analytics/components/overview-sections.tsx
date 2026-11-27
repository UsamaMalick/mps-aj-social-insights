import { EmptyState } from "@/components/data/empty-state";
import { Figure } from "@/components/data/figure";
import { formatPercent } from "@/lib/format";

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
  const [totals, highlights] = await Promise.all([getOverviewTotals(), getHighlights()]);
  if (totals.own_posts === 0) {
    return (
      <EmptyState
        title="Nothing to brief on yet"
        description="Load the sample dataset with `make seed`, then refresh this page."
      />
    );
  }
  return (
    <section aria-label="Summary" className="space-y-10">
      <h1 className="font-serif text-display max-w-4xl tracking-tight text-balance">
        {briefingHeadline(totals, highlights)}
      </h1>
      <div className="border-rule grid gap-8 border-y py-8 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-rule">
        <div className="sm:pe-8">
          <Figure
            label="Al Jazeera posts"
            value={totals.own_posts}
            format="integer"
            note="Instagram and Facebook, last 90 days."
          />
        </div>
        <div className="sm:px-8">
          <Figure
            label="Median engagement"
            value={totals.own_median_engagement_score}
            format="percent"
            aside={<>vs {formatPercent(totals.competitor_median_engagement_score)} competitors</>}
            note="(likes + comments + shares) ÷ followers, 72h after posting."
          />
        </div>
        <div className="sm:ps-8">
          <Figure
            label="Reach"
            value={totals.own_reach}
            format="compact"
            note="Own accounts only. Competitors don’t publish reach."
          />
        </div>
      </div>
    </section>
  );
}

export async function BriefingAccountsSection() {
  return <RankedAccounts rows={await getAccountSummaries()} />;
}

export async function BriefingInsightsSection() {
  const [highlights, gaps] = await Promise.all([getHighlights(), getContentGaps()]);
  return (
    <div className="space-y-8">
      <WhatsWorking highlights={highlights} />
      <ContentGapNote gaps={gaps} />
    </div>
  );
}

export async function BriefingTopPostsSection() {
  return <TopPostsList posts={await getTopPosts(STANDOUT_POSTS)} />;
}
