import { Outlet } from 'react-router-dom'
import { AuthProvider } from '../../features/auth/providers/AuthProvider'
import { ToastProvider } from '../../shared/ui'
import { PreferencesProvider } from './PreferencesProvider'
import { SmoothScroll } from './SmoothScroll'

/** Global providers. Lives inside the router so guards/pages can use both. */
export function AppProviders() {
  return (
    <SmoothScroll>
      <ToastProvider>
        <AuthProvider>
          <PreferencesProvider>
            <Outlet />
          </PreferencesProvider>
        </AuthProvider>
      </ToastProvider>
    </SmoothScroll>
  )
}
