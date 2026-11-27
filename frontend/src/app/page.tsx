import type { Metadata } from "next";
import { Suspense } from "react";

import { SectionSkeleton } from "@/components/data/section-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import {
  OverviewGapsSection,
  OverviewSummarySection,
  OverviewTopPostsSection,
} from "@/features/analytics/components/overview-sections";

export const metadata: Metadata = { title: "Overview" };

export default function OverviewPage() {
  return (
    <>
      <PageHeader
        title="Overview"
        description="How Al Jazeera's posts perform against competitors, compared at 72 hours after posting."
      />
      <Suspense fallback={<SectionSkeleton label="Loading summary" height="lg" />}>
        <OverviewSummarySection />
      </Suspense>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<SectionSkeleton label="Loading top posts" height="lg" />}>
            <OverviewTopPostsSection />
          </Suspense>
        </div>
        <Suspense fallback={<SectionSkeleton label="Loading content gaps" />}>
          <OverviewGapsSection />
        </Suspense>
      </div>
    </>
  );
}
