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
        title="Recommendations"
        description="Suggestions on how to tell stories (format, style, hook, timing, language), each with the numbers behind it. Editors make the final decision."
        actions={<GenerateButton />}
      />
      <Suspense fallback={<SectionSkeleton label="Loading recommendations" height="lg" />}>
        <RecommendationsView searchParams={searchParams} />
      </Suspense>
    </>
  );
}
