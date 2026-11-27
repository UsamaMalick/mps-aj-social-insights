import type { Metadata } from "next";
import { Suspense } from "react";

import { SectionSkeleton } from "@/components/data/section-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { CompetitorsView } from "@/features/analytics/components/competitors-view";

export const metadata: Metadata = { title: "Competitors" };

export default function CompetitorsPage({ searchParams }: PageProps<"/competitors">) {
  return (
    <>
      <PageHeader
        title="Competitors"
        description="Accounts side by side on public metrics only (likes, comments, shares, views), at 72 hours."
      />
      <Suspense fallback={<SectionSkeleton label="Loading comparison" height="lg" />}>
        <CompetitorsView searchParams={searchParams} />
      </Suspense>
    </>
  );
}
