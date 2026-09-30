import type { CSSProperties, ReactNode } from 'react'
import styles from './DataTable.module.css'

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
}

/** Light grid table: tinted header row, hairline-separated body rows. */
export function DataTable<T>({ columns, rows, rowKey, rowHeight = 48 }: DataTableProps<T>) {
  const template = columns.map((c) => (c.width ? `${c.width}px` : 'minmax(0, 1fr)')).join(' ')
  const align = (c: Column<T>): CSSProperties => ({ textAlign: c.align ?? 'left', justifyContent: c.align === 'right' ? 'flex-end' : c.align === 'center' ? 'center' : 'flex-start' })

  return (
    <div className={styles.scroll}>
      <div className={styles.table} role="table">
        <div className={`${styles.row} ${styles.head}`} style={{ gridTemplateColumns: template }} role="row">
          {columns.map((c) => (
            <span key={c.key} className={styles.headCell} style={align(c)} role="columnheader">
              {c.header}
            </span>
          ))}
        </div>
        {rows.map((row) => (
          <div key={rowKey(row)} className={styles.row} style={{ gridTemplateColumns: template, minHeight: rowHeight }} role="row">
            {columns.map((c) => (
              <span key={c.key} className={styles.cell} style={align(c)} role="cell">
                {c.render(row)}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
