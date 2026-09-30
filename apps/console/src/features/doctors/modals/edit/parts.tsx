import { cn } from '../../../../shared/lib/cn'

export function Segment<T extends string>({ value, options, onChange, label }: { value: T; options: Array<{ value: T; label: string; tone?: string }>; onChange: (v: T) => void; label: string }) {
  return (
    <div className="inline-flex gap-0.5 rounded-lg bg-surface-alt p-[3px]" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={o.value === value} className={cn('rounded-md px-2.5 py-1 text-11 font-bold', o.value === value ? 'bg-card shadow-[0_1px_2px_rgba(26,26,24,0.08)]' : 'text-ink-muted')} style={o.value === value && o.tone ? { color: o.tone } : undefined} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
