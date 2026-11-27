import type { Metadata } from "next";
import { Suspense } from "react";

import { SectionSkeleton } from "@/components/data/section-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { CompetitorsView } from "@/features/analytics/components/competitors-view";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.competitors.title };
}

export default async function CompetitorsPage({ searchParams }: PageProps<"/[lang]/competitors">) {
  const { t } = await getI18n();
  return (
    <>
      <PageHeader
        meta={t.competitors.meta}
        title={t.competitors.title}
        description={t.competitors.description}
      />
      <Suspense fallback={<SectionSkeleton label={t.competitors.loading} rows={12} />}>
        <CompetitorsView searchParams={searchParams} />
      </Suspense>
    </>
  );
}
