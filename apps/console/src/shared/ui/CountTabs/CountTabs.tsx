import { cn } from '../../lib/cn'
import { formatNumber } from '../../lib/format'

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
    <div className="flex gap-6 overflow-x-auto border-b border-border" role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.key === active
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={cn(
              '-mb-px inline-flex items-center gap-2 border-b-2 border-transparent pb-3 text-13 font-semibold whitespace-nowrap text-ink-muted',
              isActive && 'border-primary font-bold text-ink',
            )}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
            {tab.count != null && (
              <span className={cn('rounded-full px-[7px] py-0.5 text-11 font-bold', isActive ? 'bg-primary-soft text-primary' : 'bg-surface-alt text-ink-muted')}>
                {formatNumber(tab.count)}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
