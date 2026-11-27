import type { Metadata } from "next";
import { Suspense } from "react";

import { SectionSkeleton } from "@/components/data/section-skeleton";
import {
  BriefingAccountsSection,
  BriefingInsightsSection,
  BriefingLeadSection,
  BriefingTopPostsSection,
} from "@/features/analytics/components/overview-sections";

export const metadata: Metadata = { title: "Briefing" };

export default function BriefingPage() {
  return (
    <>
      <p className="eyebrow">Briefing · last 90 days · measured 72 hours after posting</p>
      <Suspense fallback={<SectionSkeleton label="Loading summary" rows={3} />}>
        <BriefingLeadSection />
      </Suspense>
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Suspense fallback={<SectionSkeleton label="Loading accounts" rows={8} />}>
            <BriefingAccountsSection />
          </Suspense>
        </div>
        <div className="lg:col-span-5">
          <Suspense fallback={<SectionSkeleton label="Loading insights" rows={5} />}>
            <BriefingInsightsSection />
          </Suspense>
        </div>
      </div>
      <Suspense fallback={<SectionSkeleton label="Loading standout posts" rows={6} />}>
        <BriefingTopPostsSection />
      </Suspense>
    </>
  );
}
