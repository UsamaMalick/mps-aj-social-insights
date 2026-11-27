import type { Metadata } from "next";
import { Suspense } from "react";

import { SectionSkeleton } from "@/components/data/section-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { PostsView } from "@/features/posts/components/posts-view";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.posts.title };
}

export default async function PostsPage({ searchParams }: PageProps<"/[lang]/posts">) {
  const { t } = await getI18n();
  return (
    <>
      <PageHeader meta={t.posts.meta} title={t.posts.title} description={t.posts.description} />
      <Suspense fallback={<SectionSkeleton label={t.posts.loading} rows={10} />}>
        <PostsView searchParams={searchParams} />
      </Suspense>
    </>
  );
}
