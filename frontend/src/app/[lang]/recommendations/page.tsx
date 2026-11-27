import type { Metadata } from "next";
import { Suspense } from "react";

import { SectionSkeleton } from "@/components/data/section-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { GenerateButton } from "@/features/recommendations/components/generate-button";
import { RecommendationsView } from "@/features/recommendations/components/recommendations-view";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.recommendations.title };
}

export default async function RecommendationsPage({
  searchParams,
}: PageProps<"/[lang]/recommendations">) {
  const { locale, t } = await getI18n();
  return (
    <>
      <PageHeader
        meta={t.recommendations.meta}
        title={t.recommendations.title}
        description={t.recommendations.description}
        actions={<GenerateButton locale={locale} />}
      />
      <Suspense fallback={<SectionSkeleton label={t.recommendations.loading} rows={6} />}>
        <RecommendationsView searchParams={searchParams} />
      </Suspense>
    </>
  );
}
