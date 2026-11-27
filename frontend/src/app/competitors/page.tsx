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
        meta="Public metrics only · measured 72 hours after posting"
        title="Competitors"
        description="Every account ranked by median engagement. Only likes, comments, shares and views are compared, because competitors don’t publish reach, saves or clicks."
      />
      <Suspense fallback={<SectionSkeleton label="Loading comparison" rows={12} />}>
        <CompetitorsView searchParams={searchParams} />
      </Suspense>
    </>
  );
}
