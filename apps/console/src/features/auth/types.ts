import type { Session } from '@supabase/supabase-js'

export type AdminRole = 'super_admin' | 'editor' | 'support'

export interface AdminProfile {
  id: string
  full_name: string
  role: AdminRole
}

/**
 * loading      – resolving the session
 * signed-out   – no session
 * needs-2fa    – password OK, TOTP step not completed (aal1)
 * no-access    – signed in but not an active console admin
 * ready        – fully authenticated (aal2) admin
 */
export type AuthStatus = 'loading' | 'signed-out' | 'needs-2fa' | 'no-access' | 'ready'

export interface AuthState {
  status: AuthStatus
  session: Session | null
  profile: AdminProfile | null
}
