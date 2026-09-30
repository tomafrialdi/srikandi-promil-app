import { Outlet } from 'react-router-dom'
import { AuthProvider } from '../../features/auth/providers/AuthProvider'

/** Global providers. Lives inside the router so guards/pages can use both. */
export function AppProviders() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}
