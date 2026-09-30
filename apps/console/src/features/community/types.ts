export type CommunityReason = 'self_harm' | 'spam' | 'medical_misinformation' | 'harassment' | 'personal_info'
export type ModStatus = 'clean' | 'open' | 'appealed' | 'approved' | 'hidden' | 'removed' | 'escalated'
export type QueueTab = 'reported' | 'ai_flagged' | 'appeals'
export type ResolveAction = 'approve' | 'hide' | 'hide_support' | 'escalate' | 'remove'

export interface CommunitySummary {
  posts_today: number
  posts_delta_pct: number | null
  open_reports: number
  urgent: number
  ai_flagged: number
  ai_precision_pct: number | null
  median_review_min: number | null
  counts: Record<QueueTab, number>
}

export interface QueueItem {
  id: string
  reason: CommunityReason
  excerpt: string
  author: string
  group: string
  flagged_at: string
  reports: number
  ai_score: number | null
  pii: boolean
}

export interface PostDetail {
  id: string
  reason: CommunityReason | null
  mod_status: ModStatus
  author: string
  group: string
  body: string
  created_at: string
  reports: number
  ai_score: number | null
  account_months: number | null
  mode: string | null
  prior_reports: number
  last_checkin: string | null
  resolution: string | null
  notes: Array<{ note: string; at: string; by: string }>
}

export interface GroupRow {
  id: string
  name: string
  visibility: 'public' | 'private'
  members: number
  posts_per_day: number
  reports_7d: number
  moderators: string[]
  status: 'healthy' | 'busy' | 'protected'
}

export interface GroupsData {
  public: number
  private: number
  rows: GroupRow[]
}

export interface KeywordRule {
  id: number
  keyword: string
  action: 'flag' | 'hide'
  reason: CommunityReason
}
