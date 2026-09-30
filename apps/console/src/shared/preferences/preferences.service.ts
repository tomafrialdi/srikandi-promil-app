import { supabase } from '../../lib/supabase'
import type { AccountPrefs } from './types'

export async function fetchPrefs(): Promise<Partial<AccountPrefs>> {
  const { data, error } = await supabase.rpc('admin_account_prefs_get')
  if (error) throw new Error(error.message)
  return (data ?? {}) as Partial<AccountPrefs>
}

export async function savePrefs(patch: Partial<AccountPrefs>): Promise<void> {
  const { error } = await supabase.rpc('admin_account_prefs_save', { p_prefs: patch })
  if (error) throw new Error(error.message)
}
