import { supabase } from '../../../lib/supabase'
import type { Agent, Macro, SupportSummary, TicketFilters, TicketFull, TicketsList, UserHit } from '../types'

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args)
  if (error) throw new Error(error.message)
  return data as T
}

export const fetchSupportSummary = () => rpc<SupportSummary>('admin_support_summary')
export const fetchTicket = (id: string) => rpc<TicketFull>('admin_support_get', { p_id: id })
export const fetchAgents = () => rpc<Agent[]>('admin_support_agents')
export const fetchMacros = () => rpc<Macro[]>('admin_support_macros')

export function fetchTickets(filters: TicketFilters, limit: number) {
  return rpc<TicketsList>('admin_support_list', { p_tab: filters.tab || 'all', p_search: filters.search || null, p_status: filters.status || 'open', p_limit: limit, p_offset: 0 })
}

export const replyToTicket = (id: string, body: string, kind: 'agent' | 'note', resolve: boolean) => rpc<void>('admin_support_reply', { p_id: id, p_body: body, p_kind: kind, p_resolve: resolve })
export const assignTicket = (id: string, admin: string | null) => rpc<void>('admin_support_assign', { p_id: id, p_admin: admin })
export const updateTicket = (id: string, patch: Record<string, unknown>) => rpc<void>('admin_support_update', { p_id: id, p_patch: patch })
export const setTicketStatus = (id: string, status: 'open' | 'pending' | 'resolved') => rpc<void>('admin_support_set_status', { p_id: id, p_status: status })
export const escalateTicket = (id: string, reason: string) => rpc<void>('admin_support_escalate', { p_id: id, p_reason: reason })
export const createTicket = (payload: Record<string, unknown>) => rpc<string>('admin_support_create', { p_payload: payload })
export const searchUsers = (q: string) => rpc<UserHit[]>('admin_support_search_users', { p_query: q })

export const saveMacro = (id: string | null, title: string, shortcut: string, body: string) => rpc<string>('admin_support_macro_save', { p_id: id, p_title: title, p_shortcut: shortcut, p_body: body })
export const deleteMacro = (id: string) => rpc<void>('admin_support_macro_delete', { p_id: id })
export const markMacroUsed = (id: string) => rpc<void>('admin_support_macro_used', { p_id: id })
