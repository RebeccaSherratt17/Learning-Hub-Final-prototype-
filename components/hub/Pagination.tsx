'use client'

import { cn } from '@/lib/cn'

/**
 * Compute page numbers to display, inserting '...' for ellipsis gaps.
 * Always shows first, last, and a window around current.
 */
export function getPageNumbers(
  current: number,
  total: number,
): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  const pages: (number | '...')[] = []

  if (current <= 3) {
    pages.push(1, 2, 3, '...', total)
  } else if (current >= total - 2) {
    pages.push(1, '...', total - 2, total - 1, total)
  } else {
    pages.push(1, '...', current - 1, current, current + 1, '...', total)
  }

  return pages
}

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const pages = getPageNumbers(currentPage, totalPages)

  return (
    <nav aria-label="Pagination" className="mt-10 flex justify-center gap-1">
      <button
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-sm px-3 py-2 text-sm text-diligent-gray-4 transition hover:bg-diligent-gray-1 disabled:opacity-40 disabled:hover:bg-transparent"
        aria-label="Previous page"
      >
        &lsaquo;
      </button>
      {pages.map((page, i) =>
        page === '...' ? (
          <span
            key={`ellipsis-${i}`}
            className="px-2 py-2 text-sm text-diligent-gray-3"
          >
            &hellip;
          </span>
        ) : (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? 'page' : undefined}
            className={cn(
              'min-w-[2.5rem] rounded-sm px-3 py-2 text-sm transition',
              page === currentPage
                ? 'bg-diligent-gray-5 font-semibold text-white'
                : 'text-diligent-gray-4 hover:bg-diligent-gray-1',
            )}
          >
            {page}
          </button>
        ),
      )}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-sm px-3 py-2 text-sm text-diligent-gray-4 transition hover:bg-diligent-gray-1 disabled:opacity-40 disabled:hover:bg-transparent"
        aria-label="Next page"
      >
        &rsaquo;
      </button>
    </nav>
  )
}
