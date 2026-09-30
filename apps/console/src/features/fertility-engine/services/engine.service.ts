import { supabase } from '../../../lib/supabase'
import type { DraftOp, EngineState, GoldenCase } from '../types'

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args)
  if (error) throw new Error(error.message)
  return data as T
}

export const fetchEngineState = () => rpc<EngineState>('admin_engine_state')
export const fetchGoldenCases = () => rpc<GoldenCase[]>('admin_engine_golden')

export const patchDraft = (ops: DraftOp[], summary: string, mode?: string) =>
  rpc<{ id: string; version: string }>('admin_engine_draft_patch', { p_ops: ops, p_summary: summary, p_mode: mode ?? null })
export const discardDraft = () => rpc<void>('admin_engine_discard_draft')
export const submitDraft = (summary: string, notes: string, golden: { pass: number; total: number; failed: number }) =>
  rpc<void>('admin_engine_submit', { p_summary: summary, p_notes: notes, p_golden: golden })
export const withdrawReview = () => rpc<void>('admin_engine_withdraw')
export const decideVersion = (id: string, approve: boolean, note?: string) =>
  rpc<void>('admin_engine_decide', { p_id: id, p_approve: approve, p_note: note || null })
export const releaseVersion = (id: string, action: 'canary' | 'expand_25' | 'expand_100' | 'rollback') =>
  rpc<void>('admin_engine_release', { p_id: id, p_action: action })
