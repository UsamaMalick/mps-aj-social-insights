import { SectionSkeleton } from "@/components/data/section-skeleton";

export default function Loading() {
  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <div className="bg-paper-2 h-4 w-24 animate-pulse rounded-sm" />
        <div className="bg-paper-2 h-10 w-80 animate-pulse rounded-sm" />
      </div>
      <SectionSkeleton label="Loading" rows={8} />
    </div>
  );
}
