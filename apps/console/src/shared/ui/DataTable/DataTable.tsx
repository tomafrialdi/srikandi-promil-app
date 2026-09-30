import type { CSSProperties, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface Column<T> {
  key: string
  header: string
  /** Fixed px width; omit to share the remaining space. */
  width?: number
  align?: 'left' | 'right' | 'center'
  render: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  rowHeight?: number
  onRowClick?: (row: T) => void
  isRowSelected?: (row: T) => boolean
  /** Extend to the card edges (default). Set false inside modals / padded areas. */
  bleed?: boolean
}

/** Light grid table: tinted header row, hairline-separated body rows. */
export function DataTable<T>({ columns, rows, rowKey, rowHeight = 48, onRowClick, isRowSelected, bleed = true }: DataTableProps<T>) {
  const template = columns.map((c) => (c.width ? `${c.width}px` : 'minmax(0, 1fr)')).join(' ')
  const align = (c: Column<T>): CSSProperties => ({
    textAlign: c.align ?? 'left',
    justifyContent: c.align === 'right' ? 'flex-end' : c.align === 'center' ? 'center' : 'flex-start',
  })
  const rowPadding = bleed ? 'px-5' : 'px-3.5'

  return (
    <div className={cn('overflow-x-auto', bleed ? '-mx-5' : 'rounded-xl border border-border')}>
      <div className="flex min-w-160 flex-col" role="table">
        <div className={cn('grid min-h-[38px] items-center gap-3 bg-surface', rowPadding)} style={{ gridTemplateColumns: template }} role="row">
          {columns.map((c) => (
            <span key={c.key} className="flex text-11 font-bold text-ink-faint" style={align(c)} role="columnheader">
              {c.header}
            </span>
          ))}
        </div>
        {rows.map((row) => (
          <div
            key={rowKey(row)}
            className={cn(
              'grid items-center gap-3 border-b border-border last:border-b-0',
              rowPadding,
              onRowClick && 'cursor-pointer hover:bg-surface',
              isRowSelected?.(row) && 'bg-primary/4 hover:bg-primary/4',
            )}
            style={{ gridTemplateColumns: template, minHeight: rowHeight }}
            role="row"
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            {columns.map((c) => (
              <span key={c.key} className="flex min-w-0 items-center gap-2 text-12 font-semibold" style={align(c)} role="cell">
                {c.render(row)}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
