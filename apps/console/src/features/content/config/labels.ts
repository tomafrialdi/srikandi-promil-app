import { FileText, Lightbulb, DeviceMobile, VideoCamera, type Icon } from '@phosphor-icons/react'
import type { BadgeTone } from '../../../shared/ui'
import type { ContentStatus, ContentType } from '../types'

export const PAGE_SIZE = 9

export const TYPE_META: Record<ContentType, { label: string; icon: Icon }> = {
  article: { label: 'Article', icon: FileText },
  daily_tip: { label: 'Daily tip', icon: Lightbulb },
  in_app_card: { label: 'In-app card', icon: DeviceMobile },
  video: { label: 'Video', icon: VideoCamera },
}

export const TYPE_FILTERS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All types' },
  ...(Object.entries(TYPE_META) as Array<[ContentType, (typeof TYPE_META)[ContentType]]>).map(([value, meta]) => ({ value, label: meta.label })),
]

export const STATUS_BADGE: Record<ContentStatus, { label: string; tone: BadgeTone; dot: string }> = {
  draft: { label: 'Draft', tone: 'neutral', dot: 'var(--ink-faint)' },
  medical_review: { label: 'Medical review', tone: 'warning', dot: 'var(--warning)' },
  changes_requested: { label: 'Changes requested', tone: 'error', dot: 'var(--error)' },
  scheduled: { label: 'Scheduled', tone: 'info', dot: 'var(--secondary)' },
  published: { label: 'Published', tone: 'success', dot: 'var(--success)' },
  archived: { label: 'Archived', tone: 'neutral', dot: 'var(--ink-faint)' },
}

export const LANG_FILTER_OPTIONS = [
  { value: '', label: 'Language' },
  { value: 'en', label: 'English' },
  { value: 'id', label: 'Bahasa' },
]
