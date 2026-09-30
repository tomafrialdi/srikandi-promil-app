import { cn } from '../../../../shared/lib/cn'

interface FilterChipsProps<K extends string> {
  filters: ReadonlyArray<{ key: K; label: string }>
  counts: Record<K, number>
  active: K
  onChange: (key: K) => void
}

/** "All 6 · Active 3 …" pills: the active one is solid ink, counts are quieter. */
export function FilterChips<K extends string>({ filters, counts, active, onChange }: FilterChipsProps<K>) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group">
      {filters.map((f) => {
        const on = f.key === active
        return (
          <button key={f.key} type="button" aria-pressed={on} className={cn('inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-11 font-bold', on ? 'border-ink bg-ink text-white' : 'border-border bg-card text-ink-muted')} onClick={() => onChange(f.key)}>
            {f.label}
            <span className={on ? 'text-white/70' : 'text-ink-faint'}>{counts[f.key]}</span>
          </button>
        )
      })}
    </div>
  )
}
