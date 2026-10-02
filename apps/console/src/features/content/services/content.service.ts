import { supabase } from '../../../lib/supabase'
import type { BulkAction, ReviewDecision, ContentFilters, ContentHighlights, ContentList, ContentOptions, ContentRecord, ContentStatus, ContentSummary, TipPoolItem } from '../types'

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args)
  if (error) throw new Error(error.message)
  return data as T
}

export const fetchContentSummary = () => rpc<ContentSummary>('admin_content_summary')
export const fetchContentHighlights = () => rpc<ContentHighlights>('admin_content_highlights')

export function fetchContentList(filters: ContentFilters, page: number, pageSize: number) {
  return rpc<ContentList>('admin_content_list', {
    p_tab: filters.tab || 'all',
    p_search: filters.search || null,
    p_type: filters.type || null,
    p_category: filters.category || null,
    p_reviewer: filters.reviewer || null,
    p_lang: filters.lang || null,
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  })
}

/** Returns how many items were actually changed (items in the wrong state are skipped). */
export const bulkContentAction = (ids: string[], action: BulkAction, at?: string) =>
  rpc<number>('admin_content_bulk_action', { p_ids: ids, p_action: action, p_at: at ?? null })

/** Approve (publish or schedule) or ask for changes. Returns how many items changed. Super admin / medical reviewer only. */
export const reviewContent = (ids: string[], decision: ReviewDecision, note?: string) =>
  rpc<number>('admin_content_review', { p_ids: ids, p_decision: decision, p_note: note ?? null })

/* ── Editor ─────────────────────────────────────────── */
export const fetchContentOptions = () => rpc<ContentOptions>('admin_content_options')
export const fetchContent = (id: string) => rpc<ContentRecord>('admin_content_get', { p_id: id })
export const saveContent = (id: string | null, payload: Record<string, unknown>) =>
  rpc<{ id: string; status: ContentStatus }>('admin_content_save', { p_id: id, p_payload: payload })
export const fetchTipPool = (category: string, exclude: string | null) => rpc<TipPoolItem[]>('admin_content_tip_pool', { p_category: category, p_exclude: exclude })
export const fetchAudience = (modes: string[], plan: string) => rpc<number>('admin_content_audience', { p_modes: modes, p_plan: plan })
