import { supabase } from '../../../lib/supabase'
import type { AdminProfile } from '../types'

export async function signInWithPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
}

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
  if (error) throw error
}

export async function signOut() {
  await logEvent('auth.sign_out').catch(() => undefined)
  await supabase.auth.signOut()
}

export async function getAssuranceLevel() {
  const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (error) throw error
  return data.currentLevel
}

export async function fetchAdminProfile(userId: string): Promise<AdminProfile | null> {
  const { data, error } = await supabase
    .from('admin_profiles')
    .select('id, full_name, role')
    .eq('id', userId)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  return data as AdminProfile | null
}

export async function logEvent(action: string, resource?: string, metadata?: Record<string, unknown>) {
  const { error } = await supabase.rpc('log_console_event', {
    p_action: action,
    p_resource: resource ?? null,
    p_metadata: metadata ?? {},
  })
  if (error) throw error
}
