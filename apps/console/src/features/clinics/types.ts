export type ClinicType = 'fertility' | 'hospital' | 'obgyn' | 'laboratory' | 'private_practice'
export type ClinicStatus = 'draft' | 'pending' | 'verified' | 'suspended'
export type ClinicTier = 'listed' | 'verified' | 'sponsor'
export type BpjsLevel = 'yes' | 'partial' | 'no'
export type DocKind = 'operating_licence' | 'nib' | 'kars' | 'bpjs_pks' | 'art_licence' | 'kfer_cert'
export type DocStatus = 'missing' | 'review' | 'verified' | 'rejected'
export type ClinicRole = 'doctor' | 'medical_director' | 'visiting'

export interface ClinicRow {
  id: string
  name: string
  type: ClinicType
  city: string
  bpjs_level: BpjsLevel
  rating: number
  tier: ClinicTier
  status: ClinicStatus
  photo: string | null
  doctors: number
  referrals: number
  submitted_at: string | null
  submitted_by: string | null
}

export interface ClinicsList {
  rows: ClinicRow[]
  total: number
}

export interface ClinicsSummary {
  counts: { all: number; pending: number; sponsors: number; suspended: number }
  cities: string[]
  can_edit: boolean
}

export interface ServiceItem {
  label: string
  icon: string
  price_min: number
  price_max: number
  bpjs: boolean
  listed: boolean
}

export interface ClinicDoc {
  kind: DocKind
  file_name: string | null
  status: DocStatus
  note: string | null
  verified_at: string | null
}

export interface LinkedDoctor {
  id: string
  name: string
  specialty: string
  years: number | null
  str_status: 'pending' | 'verified' | 'rejected'
  role: ClinicRole
  status: string
}

export type Hours = Partial<Record<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', Array<[string, string]>>>

export interface ClinicFull extends ClinicRow {
  legal_entity: string | null
  description: string | null
  photos: string[]
  phone: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  facilities: string[]
  address: string | null
  province: string | null
  postal_code: string | null
  lat: number | null
  lng: number | null
  hours: Hours
  walk_ins: boolean
  teleconsult: boolean
  access_notes: string | null
  payments: string[]
  insurers: string[]
  success: { iui_pct?: number | null; ivf_pct?: number | null; period?: string | null }
  accepts_bookings: boolean
  referral_enabled: boolean
  referral_slug: string | null
  admin_email: string | null
  admin_role: 'owner' | 'clinic_manager' | 'front_desk'
  terms_signed: boolean
  status_reason: string | null
  verified_at: string | null
  docs_request: { kinds: string[]; message: string; at: string; by: string } | null
  updated_at: string
  services: ServiceItem[]
  documents: ClinicDoc[]
  linked: LinkedDoctor[]
  str_sip: { doctors: number; verified: number; status: DocStatus }
  checklist: Array<{ key: string; label: string; ok: boolean }>
}

export interface DoctorHit {
  id: string
  name: string
  specialty: string
  years: number | null
  str_status: 'pending' | 'verified' | 'rejected'
}

export interface ClinicsFilters {
  tab: string
  search: string
  city: string
  type: string
  bpjs: string
}

export interface ClinicForm {
  name: string
  legal_entity: string
  type: ClinicType
  description: string
  photos: string[]
  phone: string
  whatsapp: string
  email: string
  website: string
  facilities: string[]
  address: string
  province: string
  city: string
  postal_code: string
  lat: string
  lng: string
  /** One text per weekday ("08:00 – 11:30 · 13:00 – 20:00"); empty = closed. */
  hours: Record<string, string>
  walk_ins: boolean
  teleconsult: boolean
  access_notes: string
  services: ServiceItem[]
  payments: string[]
  insurers: string[]
  iui_pct: string
  ivf_pct: string
  period: string
  tier: ClinicTier
  accepts_bookings: boolean
  referral_enabled: boolean
  admin_email: string
  admin_role: ClinicFull['admin_role']
  terms_signed: boolean
}

export interface ImportRow {
  name: string
  type: string
  city: string
  province: string
  address: string
  phone: string
  email: string
  website: string
}
