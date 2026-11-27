import type { Metadata } from "next";
import { Suspense } from "react";

import { SectionSkeleton } from "@/components/data/section-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { GenerateButton } from "@/features/recommendations/components/generate-button";
import { RecommendationsView } from "@/features/recommendations/components/recommendations-view";

export const metadata: Metadata = { title: "Recommendations" };

export default function RecommendationsPage({ searchParams }: PageProps<"/recommendations">) {
  return (
    <>
      <PageHeader
        meta="How to tell stories · never which stories to cover"
        title="Recommendations"
        description="Each suggestion is built from the engagement numbers and shows its evidence. Accept what you want to try; editors make the final decision."
        actions={<GenerateButton />}
      />
      <Suspense fallback={<SectionSkeleton label="Loading recommendations" rows={6} />}>
        <RecommendationsView searchParams={searchParams} />
      </Suspense>
    </>
  );
}
