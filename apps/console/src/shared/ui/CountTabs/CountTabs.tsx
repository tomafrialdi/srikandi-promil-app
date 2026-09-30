import { formatNumber } from '../../lib/format'
import styles from './CountTabs.module.css'

interface CountTab {
  key: string
  label: string
  count?: number
}

interface CountTabsProps {
  tabs: CountTab[]
  active: string
  onChange: (key: string) => void
}

/** Filter tabs with a count pill (All users · 124,806). */
export function CountTabs({ tabs, active, onChange }: CountTabsProps) {
  return (
    <div className={styles.tabs} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.key === active
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.tab} ${isActive ? styles.active : ''}`}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
            {tab.count != null && <span className={styles.count}>{formatNumber(tab.count)}</span>}
          </button>
        )
      })}
    </div>
  )
}
