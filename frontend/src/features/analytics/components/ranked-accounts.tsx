import { InlineBar } from "@/components/data/inline-bar";
import { formatLabel, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { AccountSummary } from "../types";

interface RankedAccountsProps {
  /** Already ranked by the API, highest median engagement first. */
  rows: AccountSummary[];
}

export function RankedAccounts({ rows }: RankedAccountsProps) {
  const top = rows[0]?.median_engagement_score ?? 0;

  return (
    <section aria-labelledby="ranked-heading" className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="ranked-heading" className="font-serif text-title">
          Accounts by engagement
        </h2>
        <p className="eyebrow">Median per post</p>
      </div>
      <ol className="divide-rule border-rule divide-y border-y">
        {rows.map((row, index) => {
          const isOwn = row.account.is_own;
          return (
            <li
              key={row.account.id}
              className={cn(
                "grid grid-cols-[2rem_1fr_auto] items-center gap-x-4 gap-y-2 py-3",
                isOwn && "border-ink -ms-3 border-s-2 ps-[calc(0.75rem-2px)]",
              )}
            >
              <span className="text-ink-2 tabular text-sm">{index + 1}</span>
              <div className="min-w-0 space-y-2">
                <p className="truncate text-sm">
                  <span className={cn(isOwn && "font-semibold")}>{row.account.display_name}</span>
                  <span className="text-ink-2"> · {formatLabel(row.account.platform)}</span>
                  {isOwn ? <span className="eyebrow ms-2">Own account</span> : null}
                </p>
                <InlineBar
                  ratio={top > 0 ? row.median_engagement_score / top : 0}
                  emphasis={isOwn ? "own" : "rival"}
                  label={`${row.account.display_name}: ${formatPercent(row.median_engagement_score)}`}
                />
              </div>
              <span className="tabular text-sm font-medium">
                {formatPercent(row.median_engagement_score)}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
