import type { Metadata } from "next";

import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Competitors" };

export default function Page() {
  return (
    <>
      <PageHeader
        title="Competitors"
        description="Side-by-side comparison using public metrics only."
      />
      <EmptyState title="Nothing here yet" />
    </>
  );
}
