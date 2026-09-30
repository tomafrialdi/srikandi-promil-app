import { SignOut } from '@phosphor-icons/react'
import { NavLink } from 'react-router-dom'
import { APP_NAME } from '../../config/app'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { signOut } from '../../features/auth/services/auth.service'
import { initials } from '../lib/format'
import { Avatar } from '../ui'
import { NAV_SECTIONS } from './nav.config'
import styles from './Sidebar.module.css'

const ROLE_LABEL = { super_admin: 'Super admin', editor: 'Editor', support: 'Support' } as const

export function Sidebar() {
  const { profile } = useAuth()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.logo}>{APP_NAME}</span>
        <span className={styles.tag}>ADMIN</span>
      </div>

      <nav className={styles.nav} aria-label="Main">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className={styles.section}>
            <span className={styles.sectionLabel}>{section.label}</span>
            {section.items.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ''}`}
              >
                <Icon size={18} />
                <span className={styles.itemLabel}>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {profile && (
        <div className={styles.adminCard}>
          <Avatar label={initials(profile.full_name)} size={36} tone="primary" />
          <div className={styles.adminText}>
            <span className={styles.adminName}>{profile.full_name}</span>
            <span className={styles.adminRole}>{ROLE_LABEL[profile.role]}</span>
          </div>
          <button type="button" className={styles.signOut} aria-label="Sign out" onClick={() => void signOut()}>
            <SignOut size={16} />
          </button>
        </div>
      )}
    </aside>
  )
}
