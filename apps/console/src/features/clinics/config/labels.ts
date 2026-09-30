import { Baby, Flask, Hospital, Stethoscope, UserCircle, type Icon } from '@phosphor-icons/react'
import type { BadgeTone } from '../../../shared/ui'
import type { BpjsLevel, ClinicStatus, ClinicTier, ClinicType, DocKind, DocStatus } from '../types'

export const PAGE_SIZE = 10

export const TYPE: Record<ClinicType, { label: string; short: string; icon: Icon }> = {
  fertility: { label: 'Fertility clinic', short: 'Fertility clinic', icon: Baby },
  hospital: { label: 'Hospital (RSIA / RS)', short: 'Hospital', icon: Hospital },
  obgyn: { label: 'OB-GYN practice', short: 'OB-GYN practice', icon: Stethoscope },
  laboratory: { label: 'Laboratory', short: 'Laboratory', icon: Flask },
  private_practice: { label: 'Private practice', short: 'Private practice', icon: UserCircle },
}
export const TYPE_ORDER: ClinicType[] = ['fertility', 'hospital', 'obgyn', 'laboratory']
export const TYPE_FILTER = [{ value: '', label: 'Type: All' }, ...(Object.keys(TYPE) as ClinicType[]).map((k) => ({ value: k, label: TYPE[k].short }))]
export const BPJS_FILTER = [
  { value: '', label: 'BPJS: Any' },
  { value: 'yes', label: 'Yes' },
  { value: 'partial', label: 'Partial' },
  { value: 'no', label: 'No' },
]

export const BPJS_BADGE: Record<BpjsLevel, { label: string; tone: BadgeTone }> = {
  yes: { label: 'Yes', tone: 'success' },
  partial: { label: 'Partial', tone: 'warning' },
  no: { label: 'No', tone: 'neutral' },
}

export function statusBadge(status: ClinicStatus, tier: ClinicTier): { label: string; tone: BadgeTone; dot: string } {
  if (status === 'suspended') return { label: 'Suspended', tone: 'error', dot: 'var(--error)' }
  if (status === 'pending') return { label: 'Pending', tone: 'warning', dot: 'var(--warning)' }
  if (status === 'draft') return { label: 'Draft', tone: 'neutral', dot: 'var(--ink-faint)' }
  if (tier === 'sponsor') return { label: 'Sponsor', tone: 'primary', dot: 'var(--primary)' }
  return { label: 'Verified', tone: 'success', dot: 'var(--success)' }
}

export const DOCS: Record<DocKind | 'str_sip', { label: string; short: string }> = {
  operating_licence: { label: 'Izin operasional klinik (Dinkes)', short: 'Operating licence' },
  nib: { label: 'NIB / business licence (OSS)', short: 'NIB' },
  kars: { label: 'KARS / accreditation certificate', short: 'KARS' },
  bpjs_pks: { label: 'BPJS cooperation agreement', short: 'BPJS letter' },
  art_licence: { label: 'ART / IVF licence (Kemenkes)', short: 'ART licence' },
  kfer_cert: { label: 'KFER sub-specialist certificate', short: 'KFER certificate' },
  str_sip: { label: 'STR & SIP of the doctors', short: 'STR & SIP' },
}
export const DOC_ORDER: DocKind[] = ['operating_licence', 'nib', 'kars', 'bpjs_pks', 'art_licence', 'kfer_cert']

export const DOC_STATUS: Record<DocStatus, { label: string; tone: BadgeTone }> = {
  verified: { label: 'Verified', tone: 'success' },
  review: { label: 'In review', tone: 'warning' },
  missing: { label: 'Missing', tone: 'error' },
  rejected: { label: 'Rejected', tone: 'error' },
}
export const DOC_OPTIONS = [
  { value: 'missing', label: 'Missing' },
  { value: 'review', label: 'In review' },
  { value: 'verified', label: 'Verified' },
  { value: 'rejected', label: 'Rejected' },
]

export const FACILITIES = ['IVF lab', 'Andrology lab', 'USG 4D', 'Pharmacy', 'Egg freezing', 'Prayer room', 'Parking']
export const PAYMENTS = ['BPJS Kesehatan (with referral)', 'Private insurance', 'QRIS', 'Debit / credit card', 'Instalment 0%']
export const INSURERS = ['Prudential', 'AXA Mandiri', 'Allianz', 'Admedika network']

export const DAYS = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
]

export const PROVINCES = [
  'Aceh', 'Sumatera Utara', 'Sumatera Barat', 'Riau', 'Kepulauan Riau', 'Jambi', 'Sumatera Selatan', 'Bengkulu', 'Lampung', 'Kepulauan Bangka Belitung',
  'DKI Jakarta', 'Jawa Barat', 'Banten', 'Jawa Tengah', 'DI Yogyakarta', 'Jawa Timur', 'Bali', 'Nusa Tenggara Barat', 'Nusa Tenggara Timur',
  'Kalimantan Barat', 'Kalimantan Tengah', 'Kalimantan Selatan', 'Kalimantan Timur', 'Kalimantan Utara', 'Sulawesi Utara', 'Sulawesi Tengah',
  'Sulawesi Selatan', 'Sulawesi Tenggara', 'Gorontalo', 'Sulawesi Barat', 'Maluku', 'Maluku Utara', 'Papua', 'Papua Barat',
]

export const TIERS: Array<{ value: ClinicTier; title: string; price: string; detail: string }> = [
  { value: 'listed', title: 'Listed', price: 'Free', detail: 'Name, address, contact & reviews' },
  { value: 'verified', title: 'Verified', price: 'Free', detail: '+ badge, prices, booking via app' },
  { value: 'sponsor', title: 'Sponsor', price: 'Rp 7.5jt / month', detail: '+ featured in Find a specialist, sponsored Plus codes, analytics' },
]
export const ADMIN_ROLES = [
  { value: 'clinic_manager', label: 'Clinic manager' },
  { value: 'owner', label: 'Owner' },
  { value: 'front_desk', label: 'Front desk' },
]
export const DOCTOR_ROLES = [
  { value: 'doctor', label: 'Doctor' },
  { value: 'medical_director', label: 'Medical director' },
  { value: 'visiting', label: 'Visiting' },
]
export const REPORT_PERIODS = ['2025', '2024', '2023'].map((p) => ({ value: p, label: p }))
export const STEP_DEFS = [
  { key: 'profile', label: 'Profile' },
  { key: 'location', label: 'Location & hours' },
  { key: 'services', label: 'Services & costs' },
  { key: 'doctors', label: 'Doctors & documents' },
  { key: 'partnership', label: 'Partnership & review' },
]
