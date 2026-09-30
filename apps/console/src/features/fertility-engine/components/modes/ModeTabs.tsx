import { Link } from 'react-router-dom'
import { cn } from '../../../../shared/lib/cn'
import { formatNumber } from '../../../../shared/lib/format'
import { MODES } from '../../engine/fields'
import type { ModeKey } from '../../types'

export function ModeTabs({ active, users }: { active: ModeKey; users?: Record<ModeKey, number> }) {
  return (
    <nav className="flex flex-wrap gap-2.5" aria-label="Tracking mode">
      {MODES.map((m) => {
        const on = m.key === active
        return (
          <Link key={m.key} to={`/fertility-engine/modes/${m.slug}`} aria-current={on ? 'page' : undefined} className={cn('inline-flex items-center gap-2 rounded-control border px-4 py-2.5 text-13 font-extrabold', on ? 'border-ink bg-ink text-white' : 'border-border bg-card text-ink')}>
            {m.label}
            {users && <span className={cn('text-11 font-medium', on ? 'text-white/70' : 'text-ink-faint')}>{formatNumber(users[m.key])} users</span>}
          </Link>
        )
      })}
    </nav>
  )
}
