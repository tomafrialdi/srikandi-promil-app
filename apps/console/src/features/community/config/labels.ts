import type { BadgeTone } from '../../../shared/ui'
import type { CommunityReason, GroupRow, QueueItem } from '../types'

export const REASON: Record<CommunityReason, { label: string; tone: BadgeTone; dot: string }> = {
  self_harm: { label: 'Self-harm risk', tone: 'error', dot: 'var(--error)' },
  spam: { label: 'Spam or selling', tone: 'warning', dot: 'var(--warning)' },
  medical_misinformation: { label: 'Medical misinformation', tone: 'primary', dot: 'var(--primary)' },
  harassment: { label: 'Harassment', tone: 'info', dot: 'var(--secondary)' },
  personal_info: { label: 'Personal info shared', tone: 'neutral', dot: 'var(--ink-muted)' },
}

export const REASON_OPTIONS = (Object.keys(REASON) as CommunityReason[]).map((value) => ({ value, label: REASON[value].label }))

export const GROUP_STATUS: Record<GroupRow['status'], { label: string; tone: BadgeTone; dot: string }> = {
  healthy: { label: 'Healthy', tone: 'success', dot: 'var(--success)' },
  busy: { label: 'Busy', tone: 'warning', dot: 'var(--warning)' },
  protected: { label: 'Protected', tone: 'info', dot: 'var(--secondary)' },
}

export const PROTOCOL =
  'Don’t remove silently. Hide from feed, send the private support message with the Into The Light / 119 ext 8 hotline, and offer a free counsellor session within 1 hour.'

/** Short tag shown at the right of a queue row. */
export function queueTag(item: QueueItem): string {
  if (item.reason === 'self_harm') return 'Urgent'
  if (item.reason === 'spam') return 'Spam'
  if (item.reason === 'personal_info') return 'PII'
  if (item.reports >= 3) return `${item.reports} reports`
  if (item.ai_score != null) return `AI ${item.ai_score.toFixed(2)}`
  return `${item.reports} report${item.reports === 1 ? '' : 's'}`
}

/** "4 min" / "2 h" / "3 d" */
export function shortAge(iso: string, now = Date.now()): string {
  const minutes = Math.max(1, Math.round((now - new Date(iso).getTime()) / 60_000))
  if (minutes < 60) return `${minutes} min`
  const hours = Math.round(minutes / 60)
  return hours < 24 ? `${hours} h` : `${Math.round(hours / 24)} d`
}
