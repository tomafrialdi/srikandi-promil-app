import { Buildings, ChatCircle, ClipboardText, FileText, Hospital, VideoCamera, type Icon } from '@phosphor-icons/react'
import type { BadgeTone } from '../../../shared/ui'
import type { DoctorGroup, DoctorStatus, PermArea, ServiceKind } from '../types'

export const PAGE_SIZE = 12

export const GROUP_TABS: Array<{ key: string; label: string }> = [
  { key: '', label: 'All' },
  { key: 'SpOG', label: 'SpOG' },
  { key: 'SpOG-KFER', label: 'SpOG-KFER (fertility)' },
  { key: 'SpAnd', label: 'SpAnd (andrology)' },
  { key: 'Psychologist', label: 'Psychologist' },
  { key: 'Midwife', label: 'Midwife' },
]

export const STATUS_BADGE: Record<DoctorStatus, { label: string; tone: BadgeTone }> = {
  active: { label: 'Active', tone: 'success' },
  pending: { label: 'Pending verification', tone: 'warning' },
  draft: { label: 'Draft', tone: 'neutral' },
  suspended: { label: 'Suspended', tone: 'error' },
}

export const TITLES = [
  { value: 'dr.', label: 'dr.' },
  { value: 'Bdn.', label: 'Bdn.' },
  { value: 'Prof.', label: 'Prof.' },
  { value: '', label: '—' },
]

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const SERVICE: Record<ServiceKind, { label: string; duration: string; icon: Icon }> = {
  clinic_first: { label: 'In-clinic · first visit', duration: '45 min', icon: Buildings },
  clinic_followup: { label: 'In-clinic · follow-up', duration: '20 min', icon: Hospital },
  tele_video: { label: 'Teleconsult · video', duration: '30 min', icon: VideoCamera },
  tele_chat: { label: 'Teleconsult · chat (24h)', duration: '24 h', icon: ChatCircle },
  report_review: { label: 'Doctor-report review (async)', duration: '48 h', icon: FileText },
  second_opinion: { label: 'Second opinion (IVF plan)', duration: '60 min', icon: ClipboardText },
}
export const SERVICE_ORDER: ServiceKind[] = ['clinic_first', 'clinic_followup', 'tele_video', 'tele_chat', 'report_review', 'second_opinion']

export const PERM_AREAS: Array<{ key: PermArea; label: string }> = [
  { key: 'articles', label: 'Articles & content' },
  { key: 'medications', label: 'Medication catalogue' },
  { key: 'engine', label: 'Fertility engine rules' },
  { key: 'community', label: 'Community posts' },
  { key: 'notifications', label: 'Notification copy (health claims)' },
  { key: 'clinic_verification', label: 'Clinic verification' },
]

export const BOOKING_WINDOW = [7, 14, 30, 60, 90].map((n) => ({ value: String(n), label: `Up to ${n} days ahead` }))
export const MIN_NOTICE = [1, 2, 4, 12, 24].map((n) => ({ value: String(n), label: `${n} hour${n === 1 ? '' : 's'}` }))
export const SLOT_MINUTES = [15, 20, 30, 45, 60].map((n) => ({ value: String(n), label: `${n} minutes` }))
export const BUFFER_MINUTES = [0, 5, 10, 15].map((n) => ({ value: String(n), label: n === 0 ? 'No buffer' : `${n} minutes` }))
export const PAYOUT = [
  { value: 'weekly_monday', label: 'Weekly · Monday' },
  { value: 'biweekly', label: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly' },
]
export const PAID_BY = [
  { value: 'clinic', label: 'Clinic' },
  { value: 'doctor', label: 'Doctor' },
]

export const ACTIVITY_FILTERS = [
  { key: '', label: 'All' },
  { key: 'profile', label: 'Profile changes' },
  { key: 'review', label: 'Reviews & sign-offs' },
  { key: 'consult', label: 'Consultations' },
  { key: 'security', label: 'Security' },
]

export const TIMELINE_COLORS = { primary: '#c13d68', secondary: '#2574c4', virtual: '#e0a030' }
export const GROUP_LABEL: Record<DoctorGroup, string> = {
  SpOG: 'SpOG',
  'SpOG-KFER': 'SpOG-KFER',
  SpAnd: 'SpAnd',
  Psychologist: 'Psychologist',
  Midwife: 'Midwife',
}
