import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  align?: "start" | "end";
  className?: string;
}

interface DataTableProps<T> {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  rowClassName?: (row: T) => string | undefined;
  /** Makes rows act as links (e.g. open a detail drawer). */
  rowHref?: (row: T) => string;
}

/** Dense, hairline-ruled table with tabular numbers and a sticky header. */
export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  rowClassName,
  rowHref,
}: DataTableProps<T>) {
  return (
    <div className="border-rule overflow-x-auto border-y">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-paper sticky top-0 z-10">
          <tr className="border-rule border-b">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  "eyebrow px-3 py-2.5 text-start font-medium whitespace-nowrap first:ps-0 last:pe-0",
                  column.align === "end" && "text-end",
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-rule divide-y">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={cn(
                "group transition-colors duration-150",
                rowHref && "hover:bg-paper-2/70 relative",
                rowClassName?.(row),
              )}
            >
              {columns.map((column, index) => {
                const content = column.cell(row);
                const href = rowHref?.(row);
                return (
                  <td
                    key={column.key}
                    className={cn(
                      "px-3 py-3 align-top first:ps-0 last:pe-0",
                      column.align === "end" && "tabular text-end",
                      column.className,
                    )}
                  >
                    {href && index === 0 ? (
                      // One real link per row (first cell) stretched over the row, so the
                      // whole row is clickable without nesting interactive elements.
                      <Link
                        href={href}
                        scroll={false}
                        className="focus-visible:ring-ring after:absolute after:inset-0 focus-visible:ring-2 focus-visible:outline-none"
                      >
                        {content}
                      </Link>
                    ) : (
                      content
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
