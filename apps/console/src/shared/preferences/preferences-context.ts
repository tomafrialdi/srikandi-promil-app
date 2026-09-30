import { createContext, useContext } from 'react'
import { DEFAULT_PREFS } from './defaults'
import type { AccountPrefs } from './types'

export interface PreferencesValue {
  prefs: AccountPrefs
  loaded: boolean
  /** Saves one section (`display` or `notifications`) and updates the app immediately. */
  save: <K extends keyof AccountPrefs>(section: K, value: AccountPrefs[K]) => Promise<void>
}

export const PreferencesContext = createContext<PreferencesValue>({ prefs: DEFAULT_PREFS, loaded: false, save: async () => undefined })

export const usePreferences = () => useContext(PreferencesContext)
