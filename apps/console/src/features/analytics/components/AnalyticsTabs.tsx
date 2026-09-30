import { NavLink, useLocation } from 'react-router-dom'
import { ANALYTICS_TABS } from '../config/tabs'
import styles from './AnalyticsTabs.module.css'

export function AnalyticsTabs() {
  const { search } = useLocation()
  return (
    <nav className={styles.tabs} aria-label="Analytics sections">
      {ANALYTICS_TABS.map((tab) => (
        <NavLink
          key={tab.key}
          to={{ pathname: tab.path ? `/analytics/${tab.path}` : '/analytics', search }}
          end
          className={({ isActive }) => `${styles.tab} ${isActive ? styles.active : ''}`}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
