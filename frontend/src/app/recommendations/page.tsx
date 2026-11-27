import type { Metadata } from "next";

import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Recommendations" };

export default function RecommendationsPage() {
  return (
    <>
      <PageHeader
        title="Recommendations"
        description="Evidence-backed suggestions on how to tell stories."
      />
      <EmptyState title="Recommendations are not generated yet" />
    </>
  );
}
