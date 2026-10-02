export type ContentType = 'article' | 'daily_tip' | 'in_app_card' | 'video'
export type ContentStatus = 'draft' | 'medical_review' | 'changes_requested' | 'scheduled' | 'published' | 'archived'
export type BulkAction = 'send_to_review' | 'schedule' | 'archive'

export interface ContentSummary {
  published: number
  published_this_month: number
  in_review: number
  past_sla: number
  scheduled: number
  next_scheduled_at: string | null
  drafts: number
  stale_drafts: number
  reads_30d: number
  avg_read_seconds: number | null
  counts: { all: number; draft: number; medical_review: number; scheduled: number; published: number; archived: number }
  categories: string[]
  reviewers: string[]
}

export interface ContentRow {
  id: string
  type: ContentType
  title: string
  sub: string
  category: string
  status: ContentStatus
  reviewer: string | null
  languages: Array<'en' | 'id'>
  image_url: string | null
  views_30d: number
  ctr_pct: number | null
  updated_at: string
}

export interface ContentList {
  total: number
  rows: ContentRow[]
}

export interface ContentHighlights {
  review_queue: Array<{ id: string; title: string; reviewer: string | null; status: ContentStatus; hours: number; past_sla: boolean }>
  top: Array<{ id: string; type: ContentType; title: string; views_30d: number; ctr_pct: number | null }>
}

export interface ContentFilters {
  tab: string
  search: string
  type: string
  category: string
  reviewer: string
  lang: string
}

/* ── Editor ─────────────────────────────────────────── */
export type Visibility = 'app_web' | 'app' | 'web'
export type TargetPlan = 'all' | 'free' | 'plus'
export type CardLayout = 'banner' | 'hero' | 'bottom_sheet' | 'inline_list'

export interface CardVariant {
  title: string
  body: string
  cta_label: string
  deep_link: string
  weight: number
}

export interface Chapter {
  at: string
  label: string
}

/** Every editable field for every content type; the editor only shows the ones that apply. */
export interface ContentForm {
  type: ContentType
  title: string
  slug: string
  category: string
  tags: string[]
  languages: Array<'en' | 'id'>
  visibility: Visibility
  scheduled_at: string
  image_url: string
  cover_alt: string
  dek: string
  body: string
  meta_description: string
  target_phases: string[]
  target_modes: string[]
  target_plan: TargetPlan
  reviewer_name: string
  checklist: { references: boolean; claims: boolean; reading: boolean }
  video_url: string
  duration_seconds: number | null
  /* daily tip */
  tip_icon: string
  tap_action: string
  deep_link: string
  source_ref: string
  cycle_days: number[]
  rotation: string
  priority: string
  /* in-app card */
  layout: CardLayout
  variants: CardVariant[]
  screens: string[]
  frequency_cap: number
  run_from: string
  run_to: string
  dismissible: boolean
  hide_after_conversion: boolean
  discreet_mode: boolean
  /* video */
  presenter: string
  chapters: Chapter[]
  captions: string[]
  transcript: string
  placement: string[]
  autoplay_muted: boolean
}

export type ReviewDecision = 'approve' | 'request_changes'

export interface ReviewEntry {
  decision: 'approved' | 'changes_requested'
  by: string
  note: string | null
  at: string
  /** A Super admin published a draft without a medical review. */
  skipped_review: boolean
}

export interface ContentRecord {
  id: string
  type: ContentType
  status: ContentStatus
  title: string
  slug: string | null
  category: string
  tags: string[]
  languages: Array<'en' | 'id'>
  visibility: Visibility
  scheduled_at: string | null
  image_url: string | null
  cover_alt: string | null
  dek: string | null
  body: string | null
  meta_description: string | null
  target_phases: string[]
  target_modes: string[]
  target_plan: TargetPlan
  reviewer_name: string | null
  checklist: Partial<ContentForm['checklist']>
  video_url: string | null
  duration_seconds: number | null
  details: Record<string, unknown>
  updated_at: string
  updated_by: string | null
  approved_at: string | null
  approved_by: string | null
  /** Newest first. */
  reviews: ReviewEntry[]
}

export interface ContentOptions {
  categories: string[]
  reviewers: string[]
  tags: string[]
}

export interface TipPoolItem {
  id: string
  title: string
  status: ContentStatus
  views_30d: number
}
