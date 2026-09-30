import { createContext } from 'react'
import type { AuthState } from '../types'

export interface AuthContextValue extends AuthState {
  /** True after a non-admin account tried to sign in (and was signed out again). */
  accessDenied: boolean
  dismissAccessDenied: () => void
  /** Re-resolves the auth state, e.g. right after 2FA succeeds. */
  refresh: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
