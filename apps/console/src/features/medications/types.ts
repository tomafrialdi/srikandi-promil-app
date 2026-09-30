export type MedType = 'oral' | 'injection' | 'supplement' | 'topical'
export type MedStatus = 'draft' | 'in_review' | 'published'
export type MedForm = 'tablet' | 'capsule' | 'sachet' | 'injection' | 'pen' | 'suppository' | 'gel' | 'other'

export interface Preset {
  dose: string
  frequency: string
  timing: string
  time: string
}

export interface MedRow {
  id: string
  name: string
  generic_name: string
  type: MedType
  category: string
  strength_value: number
  strength_unit: string
  form: MedForm
  brands: string[]
  rx: boolean
  status: MedStatus
  has_revision: boolean
  users: number
  adherence: number | null
}

/** The fields a reviewer signs off (also the shape of a pending revision). */
export interface MedFields {
  generic_name: string
  type: MedType
  category: string
  strength_value: number
  strength_unit: string
  form: MedForm
  brands: string[]
  bpom: string | null
  rx: boolean
  require_doctor_note: boolean
  presets: Preset[]
  reminder_template: string
  warnings: string
  show_quick_log: boolean
  show_program: boolean
  suggest_pcos: boolean
  include_report: boolean
  reviewer_id: string | null
  article_id: string | null
}

export interface MedFull extends MedRow, MedFields {
  reviewer_name: string | null
  article_title: string | null
  review_note: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  revision: MedFields | null
  revision_by: string | null
  created_by: string | null
}

export interface MedsSummary {
  catalogue: number
  categories: number
  rx: number
  users: number
  users_pct: number | null
  adherence: number | null
  counts: { all: number; supplements: number; ovulation: number; trigger_luteal: number; drafts: number }
  can_edit: boolean
  me: string
}

export interface MedsOptions {
  categories: string[]
  reviewers: Array<{ id: string; name: string; job_title: string | null }>
  articles: Array<{ id: string; title: string }>
}

export interface MedsList {
  rows: MedRow[]
  total: number
}

export interface MedsFilters {
  tab: string
  search: string
  type: string
  rx: string
}

/** Editable form state (numbers as text while typing). */
export interface MedFormState {
  type: MedType
  generic_name: string
  bpom: string
  brands: string[]
  category: string
  strength_value: string
  strength_unit: string
  form: MedForm
  rx: boolean
  require_doctor_note: boolean
  presets: Preset[]
  reminder_template: string
  show_quick_log: boolean
  show_program: boolean
  suggest_pcos: boolean
  include_report: boolean
  warnings: string
  reviewer_id: string
  article_id: string
}
