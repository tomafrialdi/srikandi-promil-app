import { Navigate, Outlet } from 'react-router-dom'
import { PageState } from '../../../shared/ui'
import { useAuth } from '../hooks/useAuth'

function Splash() {
  return <PageState title="Loading…" />
}

/** Everything behind the console: needs a fully verified (2FA) admin. */
export function RequireConsoleAccess() {
  const { status } = useAuth()
  if (status === 'loading') return <Splash />
  if (status === 'needs-2fa') return <Navigate to="/sign-in/2fa" replace />
  if (status !== 'ready') return <Navigate to="/sign-in" replace />
  return <Outlet />
}

/** Password step: only for people who are not yet through the door. */
export function GuestOnly() {
  const { status } = useAuth()
  if (status === 'loading') return <Splash />
  if (status === 'ready') return <Navigate to="/" replace />
  if (status === 'needs-2fa') return <Navigate to="/sign-in/2fa" replace />
  return <Outlet />
}

/** 2FA step: needs a password-verified session that has not finished 2FA. */
export function RequirePasswordStep() {
  const { status } = useAuth()
  if (status === 'loading') return <Splash />
  if (status === 'ready') return <Navigate to="/" replace />
  if (status !== 'needs-2fa') return <Navigate to="/sign-in" replace />
  return <Outlet />
}
