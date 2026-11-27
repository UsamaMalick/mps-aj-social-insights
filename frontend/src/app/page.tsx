import type { Metadata } from "next";

import { EmptyState } from "@/components/data/empty-state";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = { title: "Overview" };

export default function Page() {
  return (
    <>
      <PageHeader
        title="Overview"
        description="How Al Jazeera's posts perform against competitors."
      />
      <EmptyState title="Nothing here yet" />
    </>
  );
}
