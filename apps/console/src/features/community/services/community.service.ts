import { supabase } from '../../../lib/supabase'
import type { CommunityReason, CommunitySummary, GroupsData, KeywordRule, ModStatus, PostDetail, QueueItem, QueueTab, ResolveAction } from '../types'

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args)
  if (error) throw new Error(error.message)
  return data as T
}

export const fetchCommunitySummary = () => rpc<CommunitySummary>('admin_community_summary')
export const fetchQueue = (tab: QueueTab) => rpc<QueueItem[]>('admin_community_queue', { p_tab: tab })
export const fetchPost = (id: string) => rpc<PostDetail>('admin_community_post', { p_id: id })
export const resolvePost = (id: string, action: ResolveAction, note?: string) =>
  rpc<ModStatus>('admin_community_resolve', { p_id: id, p_action: action, p_note: note || null })
export const addNote = (id: string, note: string) => rpc<void>('admin_community_add_note', { p_id: id, p_note: note })

export const fetchGroups = () => rpc<GroupsData>('admin_community_groups')
export const createGroup = (payload: Record<string, unknown>) => rpc<string>('admin_community_group_create', { p_payload: payload })

export const fetchKeywordRules = () => rpc<KeywordRule[]>('admin_community_keyword_rules')
export const saveKeywordRule = (keyword: string, action: 'flag' | 'hide', reason: CommunityReason) =>
  rpc<void>('admin_community_keyword_rule_save', { p_keyword: keyword, p_action: action, p_reason: reason })
export const deleteKeywordRule = (id: number) => rpc<void>('admin_community_keyword_rule_delete', { p_id: id })

export const fetchGuidelines = () => rpc<{ text: string; updated_at: string | null }>('admin_community_guidelines')
export const saveGuidelines = (text: string) => rpc<void>('admin_community_guidelines_save', { p_text: text })
