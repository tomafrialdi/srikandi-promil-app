import { Bell, CaretDown, Info, MagnifyingGlass } from '@phosphor-icons/react'
import { env } from '../../config/env'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { initials } from '../lib/format'
import { Avatar } from '../ui'
import styles from './Topbar.module.css'

export function Topbar() {
  const { profile } = useAuth()
  const firstName = profile?.full_name.split(' ')[0] ?? ''

  return (
    <header className={styles.topbar}>
      <label className={styles.search}>
        <MagnifyingGlass size={16} color="var(--ink-faint)" />
        <input className={styles.searchInput} placeholder="Search users, articles, tickets…" />
        <kbd className={styles.kbd}>⌘K</kbd>
      </label>

      <div className={styles.right}>
        <span className={styles.env}>
          <span className={styles.envDot} />
          {env.isProduction ? 'Production' : 'Local'}
        </span>
        <button type="button" className={styles.iconButton} aria-label="Help">
          <Info size={17} />
        </button>
        <button type="button" className={styles.iconButton} aria-label="Notifications">
          <Bell size={17} />
          <span className={styles.bellDot} />
        </button>
        {profile && (
          <div className={styles.user}>
            <Avatar label={initials(profile.full_name)} size={34} tone="primary" />
            <span className={styles.userName}>{firstName}</span>
            <CaretDown size={14} color="var(--ink-muted)" />
          </div>
        )}
      </div>
    </header>
  )
}
