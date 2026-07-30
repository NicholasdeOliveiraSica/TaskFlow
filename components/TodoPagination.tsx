'use client'

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Infinity } from 'lucide-react'

export type PageSizeMode = 10 | 30 | 50 | 'all'

interface TodoPaginationProps {
  currentPage: number
  pageSize: PageSizeMode
  totalItems: number
  displayedItemsCount: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: PageSizeMode) => void
}

export function TodoPagination({
  currentPage,
  pageSize,
  totalItems,
  displayedItemsCount,
  onPageChange,
  onPageSizeChange,
}: TodoPaginationProps) {
  const isInfiniteScroll = pageSize === 'all'
  const numericSize = isInfiniteScroll ? 20 : pageSize
  const totalPages = Math.max(1, Math.ceil(totalItems / numericSize))
  const fromItem = totalItems === 0 ? 0 : (currentPage - 1) * numericSize + 1
  const toItem = isInfiniteScroll ? displayedItemsCount : Math.min(currentPage * numericSize, totalItems)

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 glass-card rounded-2xl p-4 border border-slate-800/80 mb-5 text-xs text-slate-300">

      {/* Page Size Selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="page-size-select" className="text-slate-400 font-medium">
          Show:
        </label>
        <select
          id="page-size-select"
          value={pageSize}
          onChange={(e) => {
            const val = e.target.value
            onPageSizeChange(val === 'all' ? 'all' : (Number(val) as PageSizeMode))
          }}
          className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium"
        >
          <option value={10}>10 per page</option>
          <option value={30}>30 per page</option>
          <option value={50}>50 per page</option>
          <option value="all">All (Infinite Scroll)</option>
        </select>
      </div>

      {/* Page Range / Infinite Scroll Info */}
      <div className="text-slate-400 font-medium text-center sm:text-left">
        {isInfiniteScroll ? (
          <span className="flex items-center gap-1.5 justify-center sm:justify-start">
            <Infinity className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>
              Loaded <strong className="text-slate-200 font-semibold">{displayedItemsCount}</strong> of{' '}
              <strong className="text-slate-200 font-semibold">{totalItems}</strong> items (20 at a time)
            </span>
          </span>
        ) : (
          <span>
            Showing <strong className="text-slate-200 font-semibold">{fromItem}</strong> to{' '}
            <strong className="text-slate-200 font-semibold">{toItem}</strong> of{' '}
            <strong className="text-slate-200 font-semibold">{totalItems}</strong> tasks
            <span className="hidden sm:inline"> (Page {currentPage} of {totalPages})</span>
          </span>
        )}
      </div>

      {/* Navigation Buttons (Only shown for fixed page sizes 10, 30, 50) */}
      {!isInfiniteScroll && (
        <div className="flex items-center gap-1">
          {/* First Page */}
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            aria-label="First page"
            title="First page"
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          {/* Previous Page */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous page"
            title="Previous page"
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Current Page Indicator */}
          <span className="px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-semibold text-xs min-w-[2.25rem] text-center">
            {currentPage} / {totalPages}
          </span>

          {/* Next Page */}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            aria-label="Next page"
            title="Next page"
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* Last Page */}
          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage >= totalPages}
            aria-label="Last page"
            title="Last page"
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  )
}
