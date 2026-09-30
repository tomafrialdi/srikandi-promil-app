import { SignOut } from '@phosphor-icons/react'
import { NavLink } from 'react-router-dom'
import { APP_NAME } from '../../config/app'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { signOut } from '../../features/auth/services/auth.service'
import { cn } from '../lib/cn'
import { initials } from '../lib/format'
import { Avatar } from '../ui'
import { NAV_SECTIONS } from './nav.config'

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super admin',
  admin: 'Admin',
  medical_reviewer: 'Medical reviewer',
  engine_engineer: 'Engine engineer',
  content_editor: 'Content editor',
  moderator: 'Moderator',
  support_agent: 'Support agent',
  analyst: 'Analyst',
  editor: 'Editor',
  support: 'Support',
}

export function Sidebar() {
  const { profile } = useAuth()

  return (
    <aside className="sticky top-0 hidden h-screen w-66 flex-none flex-col gap-6 border-r border-border bg-card px-4 py-6 min-[901px]:flex">
      <div className="flex items-center gap-2.5 px-2">
        <span className="text-19 font-extrabold text-primary">{APP_NAME}</span>
        <span className="rounded-md bg-ink px-[7px] py-[3px] text-10 font-extrabold text-white">ADMIN</span>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto" aria-label="Main" data-lenis-prevent>
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="flex flex-col gap-0.5">
            <span className="px-3 pb-1.5 text-11 font-bold text-ink-faint">{section.label}</span>
            {section.items.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-[10px] px-3 py-[9px] text-14 font-semibold transition-colors',
                    isActive ? 'bg-primary-soft text-primary' : 'text-ink-muted hover:bg-surface',
                  )
                }
              >
                <Icon size={18} />
                <span className="flex-1">{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {profile && (
        <div className="flex items-center gap-2.5 rounded-xl bg-surface px-3.5 py-3">
          <Avatar label={initials(profile.full_name)} size={36} tone="primary" />
          <div className="flex min-w-0 flex-1 flex-col gap-px">
            <span className="truncate text-13 font-bold">{profile.full_name}</span>
            <span className="text-11 font-semibold text-ink-muted">{ROLE_LABEL[profile.role] ?? profile.role}</span>
          </div>
          <button type="button" className="inline-flex text-ink-faint hover:text-primary" aria-label="Sign out" onClick={() => void signOut()}>
            <SignOut size={16} />
          </button>
        </div>
      )}
    </aside>
  )
}
