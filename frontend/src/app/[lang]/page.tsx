import type { Metadata } from "next";
import { Suspense } from "react";

import { SectionSkeleton } from "@/components/data/section-skeleton";
import {
  BriefingAccountsSection,
  BriefingInsightsSection,
  BriefingLeadSection,
  BriefingTopPostsSection,
} from "@/features/analytics/components/overview-sections";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  // The root page doesn't inherit the layout's title template, so it is spelled out here.
  return { title: { absolute: `${t.briefing.title} · ${t.meta.title}` } };
}

export default async function BriefingPage() {
  const { t } = await getI18n();
  return (
    <>
      <p className="eyebrow">{t.briefing.eyebrow}</p>
      <Suspense fallback={<SectionSkeleton label={t.briefing.loadingSummary} rows={3} />}>
        <BriefingLeadSection />
      </Suspense>
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Suspense fallback={<SectionSkeleton label={t.briefing.loadingAccounts} rows={8} />}>
            <BriefingAccountsSection />
          </Suspense>
        </div>
        <div className="lg:col-span-5">
          <Suspense fallback={<SectionSkeleton label={t.briefing.loadingInsights} rows={5} />}>
            <BriefingInsightsSection />
          </Suspense>
        </div>
      </div>
      <Suspense fallback={<SectionSkeleton label={t.briefing.loadingPosts} rows={6} />}>
        <BriefingTopPostsSection />
      </Suspense>
    </>
  );
}
