export type DoctorGroup = 'SpOG' | 'SpOG-KFER' | 'SpAnd' | 'Psychologist' | 'Midwife'
export type DoctorStatus = 'draft' | 'pending' | 'active' | 'suspended'
export type StrStatus = 'pending' | 'verified' | 'rejected'
export type ServiceKind = 'clinic_first' | 'clinic_followup' | 'tele_video' | 'tele_chat' | 'report_review' | 'second_opinion'
export type PermArea = 'articles' | 'medications' | 'engine' | 'community' | 'notifications' | 'clinic_verification'

export interface DoctorRow {
  id: string
  name: string
  specialty: string
  group: DoctorGroup
  photo_url: string | null
  status: DoctorStatus
  str_status: StrStatus
  rating: number
  bpjs: boolean
  location: string | null
  tele: boolean
  price: number | null
}

export interface DoctorsList {
  rows: DoctorRow[]
  total: number
}

export interface DoctorsSummary {
  listed: number
  clinics: number
  str_verified: number
  str_pending: number
  tele_active: number
  tele_new_month: number
  avg_rating: number | null
  reviews: number
  counts: Partial<Record<DoctorGroup, number>>
  total: number
  can_edit: boolean
  can_verify: boolean
}

export interface DoctorsOptions {
  specialties: Array<{ group: DoctorGroup; label: string; subtitle: string }>
  clinics: Array<{ id: string; name: string; city: string; address: string | null }>
  focus: string[]
  languages: string[]
}

export interface Location {
  id: string
  clinic_id: string | null
  kind: 'primary' | 'secondary' | 'virtual'
  label: string
  address: string | null
  sip_number: string | null
}

export interface Slot {
  location_id: string
  weekday: number
  start: string
  end: string
}

export interface TimeOff {
  from: string
  to: string
  reason: string
  note: string | null
  is_auto: boolean
}

export interface Booking {
  window_days: number
  min_notice_hours: number
  auto_confirm: boolean
  same_day_tele: boolean
  slot_minutes: number
  buffer_minutes: number
  max_patients: number
}

export interface Service {
  kind: ServiceKind
  price_idr: number
  bpjs: boolean
  active: boolean
}

export interface Perm {
  area: PermArea
  view: boolean
  review: boolean
  approve: boolean
  publish: boolean
}

export interface DoctorStats {
  referrals_30d?: number
  teleconsults_30d?: number
  articles_reviewed?: number
  visits_30d?: number
  gross_month?: number
  shared_reports?: number
  active_shares?: number
  engine_signoffs?: number
  turnaround_h?: number
  teleconsult_delta_pct?: number
  payout_next?: string
}

export interface DoctorSession {
  id: string
  user_agent: string | null
  ip: string | null
  last_seen_at: string
  current: boolean
}

export interface DoctorFull {
  id: string
  title: string
  full_name: string
  degree: string | null
  name: string
  group: DoctorGroup
  specialty: string
  years: number | null
  focus: string[]
  bio: string | null
  photo_url: string | null
  status: DoctorStatus
  status_reason: string | null
  listed: boolean
  accepting: boolean
  roles: { medical_reviewer: boolean; engine_signoff: boolean; community_expert: boolean; public_advisor: boolean }
  str: { number: string | null; valid_until: string | null; status: StrStatus; verified_at: string | null }
  sip: { number: string | null; valid_until: string | null }
  cert: { label: string | null; verified_at: string | null }
  languages: string[]
  bpjs: boolean
  rating: number
  reviews: number
  booking: Booking
  fee: { pct: number; paid_by: 'clinic' | 'doctor'; payout_schedule: string }
  bank: { holder?: string; bank?: string; last4?: string; verified_at?: string; npwp?: boolean }
  discounts: { plus_discount: boolean; accept_promos: boolean; first_tele_free: boolean }
  stats: DoctorStats
  portal_email: string | null
  updated_at: string
  updated_by: string | null
  locations: Location[]
  slots: Slot[]
  time_off: TimeOff[]
  services: Service[]
  permissions: Perm[]
  security: { tfa: string | null; last_login: string | null; sessions: DoctorSession[] }
  activity_counts: Record<string, number>
}

export interface ActivityItem {
  id: number
  category: 'profile' | 'review' | 'consult' | 'security'
  icon: string
  tone: 'success' | 'info' | 'warning' | 'error' | 'neutral'
  title: string
  detail: string | null
  at: string
}

export interface VerifyItem {
  id: string
  name: string
  specialty: string
  str_number: string | null
  sip_number: string | null
  sip_valid_until: string | null
  clinic: string
  created_at: string
}

export interface DoctorsFilters {
  group: string
  search: string
}

/** Editable copy of everything the edit modal can change. */
export interface DoctorForm {
  profile: { title: string; full_name: string; degree: string; specialty_group: DoctorGroup; years_experience: string; focus: string[]; bio: string; photo_url: string }
  flags: { listed: boolean; accepting: boolean; medical_reviewer: boolean; engine_signoff: boolean; community_expert: boolean; public_advisor: boolean; bpjs: boolean; languages: string[] }
  locations: Location[]
  slots: Slot[]
  time_off: TimeOff[]
  booking: Booking
  services: Service[]
  payout: { paid_by: 'clinic' | 'doctor'; payout_schedule: string; discounts: DoctorFull['discounts'] }
  permissions: Perm[]
}
