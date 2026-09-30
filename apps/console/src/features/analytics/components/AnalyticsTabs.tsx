import { NavLink, useLocation } from 'react-router-dom'
import { cn } from '../../../shared/lib/cn'
import { ANALYTICS_TABS } from '../config/tabs'

export function AnalyticsTabs() {
  const { search } = useLocation()
  return (
    <nav className="flex gap-6 overflow-x-auto border-b border-border" aria-label="Analytics sections">
      {ANALYTICS_TABS.map((tab) => (
        <NavLink
          key={tab.key}
          to={{ pathname: tab.path ? `/analytics/${tab.path}` : '/analytics', search }}
          end
          className={({ isActive }) =>
            cn(
              '-mb-px border-b-2 border-transparent pb-3 text-14 font-semibold whitespace-nowrap text-ink-muted hover:text-ink',
              isActive && 'border-primary font-bold text-primary hover:text-primary',
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}
