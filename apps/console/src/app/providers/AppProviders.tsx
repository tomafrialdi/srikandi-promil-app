import { Outlet } from 'react-router-dom'
import { AuthProvider } from '../../features/auth/providers/AuthProvider'
import { ToastProvider } from '../../shared/ui'

/** Global providers. Lives inside the router so guards/pages can use both. */
export function AppProviders() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </ToastProvider>
  )
}
