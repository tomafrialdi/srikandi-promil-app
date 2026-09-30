import type { ReactNode } from 'react'

/** Label over value cells; cells with no value are skipped. */
export function InfoGrid({ items }: { items: Array<[string, ReactNode | null | undefined]> }) {
  const shown = items.filter(([, v]) => v != null && v !== '')
  return (
    <dl className="m-0 grid gap-x-4 gap-y-3 rounded-xl bg-surface px-4 py-3.5 min-[701px]:grid-cols-3">
      {shown.map(([label, value]) => (
        <div key={label} className="flex min-w-0 flex-col gap-0.5">
          <dt className="text-11 font-bold text-ink-faint">{label}</dt>
          <dd className="m-0 text-13 font-semibold break-words">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Vertical timeline dot list (related events, DSR progress). */
export function Timeline({ items }: { items: Array<{ key: string; time: string; text: string; state?: 'now' | 'done' | 'pending' }> }) {
  return (
    <ol className="m-0 flex list-none flex-col gap-2.5 p-0">
      {items.map((i) => (
        <li key={i.key} className="flex items-baseline gap-3">
          <span className={`mt-1.5 size-2 flex-none rounded-full ${i.state === 'now' ? 'bg-primary' : i.state === 'pending' ? 'border border-border bg-card' : 'bg-ink-faint'}`} />
          <span className="w-24 flex-none font-mono text-11 font-medium text-ink-muted">{i.time}</span>
          <span className={`min-w-0 text-13 ${i.state === 'now' ? 'font-extrabold' : 'font-medium'} ${i.state === 'pending' ? 'text-ink-muted' : ''}`}>{i.text}</span>
        </li>
      ))}
    </ol>
  )
}
