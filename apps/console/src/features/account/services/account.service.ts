import { createClient } from '@supabase/supabase-js'
import { env } from '../../../config/env'
import { supabase } from '../../../lib/supabase'
import type { AccountData, ActivityRow, SessionRow, TokensData } from '../types'

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args)
  if (error) throw new Error(error.message)
  return data as T
}

export const fetchAccount = () => rpc<AccountData>('admin_account_get')
export const updateProfile = (payload: Record<string, unknown>) => rpc<void>('admin_account_update_profile', { p_payload: payload })
export const requestDeactivation = (reason: string) => rpc<void>('admin_account_request_deactivation', { p_reason: reason })

/** Checks the current password on a throwaway client so this browser's session (and its 2FA level) is untouched. */
async function verifyPassword(email: string, password: string): Promise<void> {
  const probe = createClient(env.supabaseUrl, env.supabasePublishableKey, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
  const { error } = await probe.auth.signInWithPassword({ email, password })
  if (error) throw new Error('The current password is not correct.')
}

export async function changePassword(email: string, current: string, next: string): Promise<void> {
  await verifyPassword(email, current)
  const { error } = await supabase.auth.updateUser({ password: next })
  if (error) throw new Error(error.message)
  await rpc<void>('admin_account_password_changed')
  await supabase.auth.signOut({ scope: 'others' })
}

export const fetchSessions = () => rpc<SessionRow[]>('admin_account_sessions')
export const revokeSession = (id: string) => rpc<void>('admin_account_revoke_session', { p_id: id })
export async function signOutOtherSessions(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: 'others' })
  if (error) throw new Error(error.message)
}
export const fetchActivity = () => rpc<ActivityRow[]>('admin_account_security_activity')
export const generateBackupCodes = () => rpc<string[]>('admin_account_backup_codes_generate')

export const fetchTokens = () => rpc<TokensData>('admin_account_tokens')
export const createToken = (name: string, scopes: string[], days: number, ips: string) =>
  rpc<{ id: string; token: string }>('admin_account_token_create', { p_name: name, p_scopes: scopes, p_expires_in_days: days, p_allowed_ips: ips || null })
export const revokeToken = (id: string) => rpc<void>('admin_account_token_revoke', { p_id: id })
