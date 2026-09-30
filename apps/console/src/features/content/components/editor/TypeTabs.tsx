import { cn } from '../../../../shared/lib/cn'
import { TYPE_META } from '../../config/labels'
import type { ContentType } from '../../types'

interface TypeTabsProps {
  value: ContentType
  onChange: (type: ContentType) => void
  /** Existing items cannot change type. */
  locked: boolean
}

export function TypeTabs({ value, onChange, locked }: TypeTabsProps) {
  return (
    <div className="flex flex-wrap gap-1.5 self-start rounded-xl bg-surface-alt p-1" role="tablist" aria-label="Content type">
      {(Object.keys(TYPE_META) as ContentType[]).map((type) => {
        const { label, icon: Icon } = TYPE_META[type]
        const active = type === value
        return (
          <button
            key={type}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={locked && !active}
            className={cn(
              'inline-flex h-8 items-center gap-2 rounded-lg px-3 text-13 font-semibold disabled:opacity-45',
              active ? 'bg-card font-bold text-ink shadow-[0_1px_2px_rgba(26,26,24,0.08)]' : 'text-ink-muted',
            )}
            onClick={() => onChange(type)}
          >
            <Icon size={15} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
