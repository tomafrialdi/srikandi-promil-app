import styles from './Legend.module.css'

export interface LegendEntry {
  label: string
  color: string
}

export function Legend({ items }: { items: LegendEntry[] }) {
  return (
    <ul className={styles.legend}>
      {items.map((item) => (
        <li key={item.label} className={styles.item}>
          <span className={styles.swatch} style={{ background: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  )
}
