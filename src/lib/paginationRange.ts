const DOTS = "…" as const;

export type PaginationItem = number | typeof DOTS;

/**
 * Windowed page-number range for a numbered pagination control: always
 * shows the first and last page plus `siblingCount` pages on each side
 * of `currentPage`, collapsing any gap into a single "…" marker instead
 * of listing every page in between. Falls back to listing every page
 * when the total is small enough that no collapsing is needed.
 */
export function getPaginationRange(
  currentPage: number,
  totalPages: number,
  siblingCount = 1,
): PaginationItem[] {
  if (totalPages <= 0) return [];

  const totalVisibleNumbers = siblingCount * 2 + 5; // first + last + current + 2 siblings + slack
  if (totalPages <= totalVisibleNumbers) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = new Set<number>([1, totalPages]);
  for (let i = currentPage - siblingCount; i <= currentPage + siblingCount; i++) {
    if (i >= 1 && i <= totalPages) pages.add(i);
  }

  const sorted = [...pages].sort((a, b) => a - b);
  const result: PaginationItem[] = [];
  let previous: number | undefined;
  for (const page of sorted) {
    if (previous !== undefined && page - previous > 1) {
      result.push(DOTS);
    }
    result.push(page);
    previous = page;
  }
  return result;
}
