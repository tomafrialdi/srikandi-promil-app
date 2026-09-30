import { Bell, CaretDown, Info, MagnifyingGlass } from '@phosphor-icons/react'
import { env } from '../../config/env'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { initials } from '../lib/format'
import { Avatar } from '../ui'

const ICON_BUTTON = 'relative inline-flex size-[38px] items-center justify-center rounded-full border border-border'

export function Topbar() {
  const { profile } = useAuth()
  const firstName = profile?.full_name.split(' ')[0] ?? ''

  return (
    <header className="sticky top-0 z-10 flex h-18 flex-none items-center justify-between gap-4 border-b border-border bg-card px-4 min-[701px]:px-8">
      <label className="flex w-95 max-w-full items-center gap-2.5 rounded-[10px] bg-surface px-3.5 py-2.5">
        <MagnifyingGlass size={16} color="var(--ink-faint)" />
        <input className="min-w-0 flex-1 border-0 bg-transparent text-13 font-medium outline-0 placeholder:text-ink-faint" placeholder="Search users, articles, tickets…" />
        <kbd className="rounded-md bg-card px-1.5 py-0.5 font-[inherit] text-11 font-bold text-ink-muted">⌘K</kbd>
      </label>

      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-1.5 rounded-full bg-success-soft px-2.5 py-[5px] text-12 font-bold text-success min-[701px]:inline-flex">
          <span className="size-[7px] rounded-full bg-success" />
          {env.isProduction ? 'Production' : 'Local'}
        </span>
        <button type="button" className={ICON_BUTTON} aria-label="Help">
          <Info size={17} />
        </button>
        <button type="button" className={ICON_BUTTON} aria-label="Notifications">
          <Bell size={17} />
          <span className="absolute top-2 right-[9px] size-2 rounded-full border-[1.5px] border-card bg-primary" />
        </button>
        {profile && (
          <div className="flex items-center gap-2.5 pl-3">
            <Avatar label={initials(profile.full_name)} size={34} tone="primary" />
            <span className="hidden text-13 font-bold min-[701px]:inline">{firstName}</span>
            <CaretDown size={14} color="var(--ink-muted)" />
          </div>
        )}
      </div>
    </header>
  )
}
