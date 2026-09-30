import styles from './Columns.module.css'

export interface ColumnItem {
  /** Axis label (empty string hides it but keeps the spacing). */
  label: string
  value: number
  color: string
  /** Text above the bar. */
  valueLabel?: string
  /** Emphasise label + value (e.g. "today"). */
  active?: boolean
  title?: string
}

interface ColumnsProps {
  items: ColumnItem[]
  height: number
  gap?: number
  /** Round the top corners by this many px. */
  radius?: number
}

/** Single-series vertical bars with optional value labels and axis labels. */
export function Columns({ items, height, gap = 8, radius = 4 }: ColumnsProps) {
  const max = Math.max(1, ...items.map((item) => item.value))
  return (
    <div className={styles.columns} style={{ height, gap }}>
      {items.map((item, index) => (
        <div key={index} className={styles.column} title={item.title}>
          {item.valueLabel != null && (
            <span className={`${styles.value} ${item.active ? styles.active : ''}`}>{item.valueLabel}</span>
          )}
          <div className={styles.plot}>
            <div
              className={styles.bar}
              style={{
                height: `${(item.value / max) * 100}%`,
                background: item.color,
                borderRadius: `${radius}px ${radius}px 0 0`,
              }}
            />
          </div>
          <span className={`${styles.label} ${item.active ? styles.active : ''}`}>{item.label}</span>
        </div>
      ))}
    </div>
  )
}
