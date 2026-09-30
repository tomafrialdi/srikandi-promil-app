import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useAuth } from '../../features/auth/hooks/useAuth'
import { DEFAULT_PREFS, withDefaults } from '../../shared/preferences/defaults'
import { PreferencesContext } from '../../shared/preferences/preferences-context'
import { fetchPrefs, savePrefs } from '../../shared/preferences/preferences.service'
import type { AccountPrefs } from '../../shared/preferences/types'

/** Loads the signed-in admin's saved preferences once and shares them (density, landing page, default range…). */
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { status } = useAuth()
  const [prefs, setPrefs] = useState<AccountPrefs>(DEFAULT_PREFS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (status !== 'ready') return
    let cancelled = false
    fetchPrefs()
      .then((saved) => !cancelled && setPrefs(withDefaults(saved)))
      .catch(() => undefined)
      .finally(() => !cancelled && setLoaded(true))
    return () => {
      cancelled = true
    }
  }, [status])

  const save = useCallback(async <K extends keyof AccountPrefs>(section: K, value: AccountPrefs[K]) => {
    await savePrefs({ [section]: value })
    setPrefs((current) => ({ ...current, [section]: value }))
  }, [])

  const value = useMemo(() => ({ prefs, loaded, save }), [prefs, loaded, save])
  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
}
