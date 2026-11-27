interface SectionSkeletonProps {
  label: string;
  rows?: number;
}

/** Hairline rows that match the editorial list/table layouts while data loads. */
export function SectionSkeleton({ label, rows = 6 }: SectionSkeletonProps) {
  return (
    <div aria-busy="true" aria-label={label} className="space-y-4">
      <div className="bg-paper-2 h-5 w-40 animate-pulse rounded-sm" />
      <div className="divide-rule border-rule divide-y border-y">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 py-4">
            <div className="bg-paper-2 h-4 flex-1 animate-pulse rounded-sm" />
            <div className="bg-paper-2 h-4 w-20 animate-pulse rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  );
}
