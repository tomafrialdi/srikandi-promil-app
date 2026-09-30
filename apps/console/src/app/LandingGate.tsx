import { useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreferences } from '../shared/preferences/preferences-context'

const KEY = 'srikandi.landing.applied'

/** Once per browser session, sends the admin to their chosen landing page instead of the dashboard. */
export function LandingGate({ children }: { children: ReactNode }) {
  const { prefs, loaded } = usePreferences()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loaded) return
    try {
      if (sessionStorage.getItem(KEY)) return
      sessionStorage.setItem(KEY, '1')
    } catch {
      return
    }
    if (prefs.display.landing !== '/') navigate(prefs.display.landing, { replace: true })
  }, [loaded, prefs.display.landing, navigate])

  return <>{children}</>
}
