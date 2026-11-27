export type PageItem = number | "gap";

/** Page numbers to show: first, last, current ± 1, with gaps, e.g. 1 … 4 5 6 … 20. */
export function pageItems(current: number, pageCount: number): PageItem[] {
  // Candidates are already in ascending order; drop out-of-range values and duplicates.
  const candidates = [1, current - 1, current, current + 1, pageCount];
  const items: PageItem[] = [];
  let previous = 0;
  for (const page of candidates) {
    if (page < 1 || page > pageCount || page <= previous) continue;
    if (page - previous > 1 && previous > 0) items.push("gap");
    items.push(page);
    previous = page;
  }
  return items;
}
