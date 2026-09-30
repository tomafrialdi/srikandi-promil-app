import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { formatNumber } from '../../lib/format'
import styles from './Pagination.module.css'

interface PaginationProps {
  /** 1-based */
  page: number
  pageSize: number
  total: number
  onChange: (page: number) => void
}

/** 1 2 3 … N with previous / next, plus "Showing a–b of total". */
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

export function Pagination({ page, pageSize, total, onChange }: PaginationProps) {
  const last = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(total, page * pageSize)

  return (
    <div className={styles.bar}>
      <span className={styles.summary}>
        Showing {formatNumber(from)}–{formatNumber(to)} of {formatNumber(total)}
      </span>
      <nav className={styles.pages} aria-label="Pagination">
        <button type="button" className={styles.page} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
          <CaretLeft size={14} />
        </button>
        {pageItems(page, last).map((item, index) =>
          item === 'gap' ? (
            <span key={`gap-${index}`} className={styles.gap}>
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              className={`${styles.page} ${item === page ? styles.current : ''}`}
              aria-current={item === page ? 'page' : undefined}
              onClick={() => onChange(item)}
            >
              {formatNumber(item)}
            </button>
          ),
        )}
        <button type="button" className={styles.page} disabled={page >= last} onClick={() => onChange(page + 1)} aria-label="Next page">
          <CaretRight size={14} />
        </button>
      </nav>
    </div>
  )
}
