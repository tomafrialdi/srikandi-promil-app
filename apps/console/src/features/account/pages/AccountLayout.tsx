import { BellRinging, Key, ShieldCheck, SignOut, SlidersHorizontal, User } from '@phosphor-icons/react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Avatar } from '../../../shared/ui'
import { cn } from '../../../shared/lib/cn'
import { initials } from '../../../shared/lib/format'
import { signOut } from '../../auth/services/auth.service'
import { useAuth } from '../../auth/hooks/useAuth'

const TABS = [
  { to: '/account-settings', label: 'Profile', icon: User, end: true, subtitle: 'Manage your admin profile, security and preferences.' },
  { to: '/account-settings/security', label: 'Security', icon: ShieldCheck, subtitle: 'Password, two-factor authentication, passkeys and active sessions.' },
  { to: '/account-settings/notifications', label: 'Notifications', icon: BellRinging, subtitle: 'Choose what you hear about and where.' },
  { to: '/account-settings/preferences', label: 'Preferences', icon: SlidersHorizontal, subtitle: 'Language, region and how the console looks for you.' },
  { to: '/account-settings/api-tokens', label: 'API tokens', icon: Key, subtitle: 'Personal tokens for scripts & BI tools. Tokens inherit your role — keep scopes minimal.' },
]

export function AccountLayout() {
  const { profile } = useAuth()
  const { pathname } = useLocation()
  const current = TABS.find((t) => (t.end ? pathname === t.to : pathname.startsWith(t.to))) ?? TABS[0]!

  return (
    <>
      <div className="flex flex-col gap-1">
        <h1 className="text-26 font-extrabold">Account settings</h1>
        <p className="text-14 text-ink-muted">{current.subtitle}</p>
      </div>
      <div className="flex flex-col items-stretch gap-5 min-[1001px]:flex-row min-[1001px]:items-start">
        <nav className="flex w-full flex-none flex-col gap-1 rounded-card border border-border bg-card p-3 min-[1001px]:w-55" aria-label="Account settings">
          {profile && (
            <div className="mb-2 flex items-center gap-2.5 border-b border-border px-1 pt-1 pb-3">
              <Avatar label={initials(profile.full_name)} size={36} tone="primary" />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-13 font-bold">{profile.full_name}</span>
                <span className="text-11 font-semibold text-ink-muted">{profile.role.replace('_', ' ')}</span>
              </div>
            </div>
          )}
          <div className="flex gap-1 overflow-x-auto min-[1001px]:flex-col">
            {TABS.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn('flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-13 font-semibold whitespace-nowrap', isActive ? 'bg-primary-soft text-primary' : 'text-ink-muted hover:bg-surface')
                }
              >
                <Icon size={16} />
                {label}
              </NavLink>
            ))}
          </div>
          <button type="button" className="mt-1 flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-13 font-semibold text-error hover:bg-error-soft" onClick={() => void signOut()}>
            <SignOut size={16} />
            Sign out
          </button>
        </nav>
        <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
          <Outlet />
        </div>
      </div>
    </>
  )
}
