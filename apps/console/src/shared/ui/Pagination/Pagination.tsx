import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { cn } from '../../lib/cn'
import { formatNumber } from '../../lib/format'

interface PaginationProps {
  /** 1-based */
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}

function pageItems(page: number, last: number): Array<number | 'gap'> {
  if (last <= 6) return Array.from({ length: last }, (_, i) => i + 1)
  const items: Array<number | 'gap'> = [1]
  const start = Math.max(2, Math.min(page - 1, last - 3))
  const end = Math.min(last - 1, start + 2)
  if (start > 2) items.push('gap')
  for (let p = start; p <= end; p++) items.push(p)
  if (end < last - 1) items.push('gap')
  items.push(last)
  return items
}

const PAGE = 'inline-flex h-8 min-w-8 items-center justify-center rounded-lg border border-border bg-card px-2 text-12 font-bold disabled:opacity-45'

/** 1 2 3 … N with previous / next, plus "Showing a–b of total". */
export function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const last = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <span className="text-12 text-ink-muted">
        Showing {formatNumber(from)}–{formatNumber(to)} of {formatNumber(total)}
      </span>
      <nav className="flex items-center gap-1.5" aria-label="Pagination">
        <button type="button" className={PAGE} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
          <CaretLeft size={14} />
        </button>
        {pageItems(page, last).map((item, index) =>
          item === 'gap' ? (
            <span key={`gap-${index}`} className="px-1 text-ink-faint">
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={cn(PAGE, item === page && 'border-ink bg-ink text-white')}
              aria-current={item === page ? 'page' : undefined}
              onClick={() => onChange(item)}
            >
              {formatNumber(item)}
            </button>
          ),
        )}
        <button type="button" className={PAGE} disabled={page >= last} onClick={() => onChange(page + 1)} aria-label="Next page">
          <CaretRight size={14} />
        </button>
      </nav>
    </div>
  )
}
