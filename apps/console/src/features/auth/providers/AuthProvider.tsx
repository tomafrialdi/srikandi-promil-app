import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../../../lib/supabase'
import { AuthContext } from './auth-context'
import { fetchAdminProfile, getAssuranceLevel, signOut } from '../services/auth.service'
import type { AuthState } from '../types'

const INITIAL: AuthState = { status: 'loading', session: null, profile: null }

async function resolveState(session: Session | null): Promise<AuthState> {
  if (!session) return { status: 'signed-out', session: null, profile: null }

  const profile = await fetchAdminProfile(session.user.id)
  if (!profile) return { status: 'no-access', session, profile: null }

  const level = await getAssuranceLevel()
  return { status: level === 'aal2' ? 'ready' : 'needs-2fa', session, profile }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(INITIAL)
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [accessDenied, setAccessDenied] = useState(false)

  // Keep the raw session in sync. Never await Supabase calls inside this callback.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session === undefined) return
    let cancelled = false
    resolveState(session)
      .then((next) => {
        if (cancelled) return
        if (next.status === 'no-access') {
          // Not a console admin: sign out again; the sign-in page explains why.
          setAccessDenied(true)
          void signOut()
          return
        }
        setState(next)
      })
      .catch(() => !cancelled && setState({ status: 'signed-out', session: null, profile: null }))
    return () => {
      cancelled = true
    }
  }, [session])

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession()
    setState(await resolveState(data.session))
  }, [])

  const dismissAccessDenied = useCallback(() => setAccessDenied(false), [])

  const value = useMemo(
    () => ({ ...state, accessDenied, dismissAccessDenied, refresh }),
    [state, accessDenied, dismissAccessDenied, refresh],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
