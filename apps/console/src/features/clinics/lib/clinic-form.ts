import { DAYS } from '../config/labels'
import type { ClinicForm, ClinicFull, Hours, ServiceItem } from '../types'

export const DEFAULT_SERVICES: ServiceItem[] = [
  { label: 'OB-GYN consultation', icon: 'stethoscope', price_min: 0, price_max: 0, bpjs: false, listed: false },
  { label: 'Fertility work-up (HSG, AMH, USG)', icon: 'scan', price_min: 0, price_max: 0, bpjs: false, listed: false },
  { label: 'Semen analysis', icon: 'microscope', price_min: 0, price_max: 0, bpjs: false, listed: false },
  { label: 'IUI · per cycle', icon: 'syringe', price_min: 0, price_max: 0, bpjs: false, listed: false },
  { label: 'IVF · per cycle', icon: 'flask', price_min: 0, price_max: 0, bpjs: false, listed: false },
  { label: 'Egg freezing', icon: 'snowflake', price_min: 0, price_max: 0, bpjs: false, listed: false },
]

export function blankForm(): ClinicForm {
  return {
    name: '', legal_entity: '', type: 'fertility', description: '', photos: [], phone: '', whatsapp: '', email: '', website: '', facilities: [],
    address: '', province: '', city: '', postal_code: '', lat: '', lng: '', hours: {}, walk_ins: false, teleconsult: false, access_notes: '',
    services: DEFAULT_SERVICES, payments: [], insurers: [], iui_pct: '', ivf_pct: '', period: '2025', tier: 'listed', accepts_bookings: false,
    referral_enabled: false, admin_email: '', admin_role: 'clinic_manager', terms_signed: false,
  }
}

/** "08:00 – 11:30 · 13:00 – 20:00" from [["08:00","11:30"],["13:00","20:00"]] */
export const formatRanges = (ranges: Array<[string, string]> | undefined): string => (ranges ?? []).map(([a, b]) => `${a} – ${b}`).join(' · ')

/** Returns the ranges, or null when the text is not valid ("closed" and "" are valid = no ranges). */
export function parseRanges(text: string): Array<[string, string]> | null {
  const t = text.trim()
  if (t === '' || /^closed$/i.test(t)) return []
  const out: Array<[string, string]> = []
  for (const part of t.split(/\s*(?:·|,|;|\/)\s*/)) {
    const m = part.match(/^(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})$/)
    if (!m) return null
    const a = `${m[1]!.padStart(2, '0')}:${m[2]}`
    const b = `${m[3]!.padStart(2, '0')}:${m[4]}`
    if (a >= b || Number(m[1]) > 23 || Number(m[3]) > 23 || Number(m[2]) > 59 || Number(m[4]) > 59) return null
    out.push([a, b])
  }
  return out
}

export function toForm(c: ClinicFull): ClinicForm {
  const hours: Record<string, string> = {}
  for (const d of DAYS) hours[d.key] = formatRanges(c.hours[d.key as keyof Hours])
  return {
    name: c.name, legal_entity: c.legal_entity ?? '', type: c.type, description: c.description ?? '', photos: c.photos, phone: c.phone ?? '', whatsapp: c.whatsapp ?? '',
    email: c.email ?? '', website: c.website ?? '', facilities: c.facilities, address: c.address ?? '', province: c.province ?? '', city: c.city, postal_code: c.postal_code ?? '',
    lat: c.lat != null ? String(c.lat) : '', lng: c.lng != null ? String(c.lng) : '', hours, walk_ins: c.walk_ins, teleconsult: c.teleconsult, access_notes: c.access_notes ?? '',
    services: c.services.length ? c.services : DEFAULT_SERVICES, payments: c.payments, insurers: c.insurers,
    iui_pct: c.success.iui_pct != null ? String(c.success.iui_pct) : '', ivf_pct: c.success.ivf_pct != null ? String(c.success.ivf_pct) : '', period: c.success.period ?? '2025',
    tier: c.tier, accepts_bookings: c.accepts_bookings, referral_enabled: c.referral_enabled, admin_email: c.admin_email ?? '', admin_role: c.admin_role, terms_signed: c.terms_signed,
  }
}

export function hoursIssue(f: ClinicForm): string | null {
  for (const d of DAYS) if (parseRanges(f.hours[d.key] ?? '') === null) return `Check the opening hours for ${d.label}`
  return null
}

export function toPayload(f: ClinicForm): Record<string, unknown> {
  const hours: Record<string, Array<[string, string]>> = {}
  for (const d of DAYS) {
    const r = parseRanges(f.hours[d.key] ?? '')
    if (r && r.length) hours[d.key] = r
  }
  const pct = (v: string) => (v.trim() === '' ? null : Number(v))
  return {
    name: f.name.trim(), legal_entity: f.legal_entity, type: f.type, description: f.description, photos: f.photos, phone: f.phone, whatsapp: f.whatsapp, email: f.email,
    website: f.website, facilities: f.facilities, address: f.address, province: f.province, city: f.city, postal_code: f.postal_code, lat: f.lat, lng: f.lng, hours,
    walk_ins: f.walk_ins, teleconsult: f.teleconsult, access_notes: f.access_notes,
    services: f.services.map((s) => ({ ...s, price_min: Number(s.price_min) || 0, price_max: Math.max(Number(s.price_max) || 0, Number(s.price_min) || 0) })),
    payments: f.payments, insurers: f.insurers, success: { iui_pct: pct(f.iui_pct), ivf_pct: pct(f.ivf_pct), period: f.period },
    tier: f.tier, accepts_bookings: f.accepts_bookings, referral_enabled: f.referral_enabled, admin_email: f.admin_email, admin_role: f.admin_role, terms_signed: f.terms_signed,
  }
}

export const slugOf = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60)

const unit = (n: number) => (n >= 1_000_000 ? 'jt' : 'rb')
const num = (n: number) => (n >= 1_000_000 ? String(Number((n / 1_000_000).toFixed(1))) : String(Math.round(n / 1000)))
/** 300000, 450000 -> "Rp 300–450rb"; 4500000, 6000000 -> "Rp 4.5–6jt" */
export function priceRange(min: number, max: number): string {
  if (max <= 0 && min <= 0) return '—'
  if (min === max || min <= 0) return `Rp ${num(max)}${unit(max)}`
  return unit(min) === unit(max) ? `Rp ${num(min)}–${num(max)}${unit(max)}` : `Rp ${num(min)}${unit(min)}–${num(max)}${unit(max)}`
}

/** Tiny CSV reader: quotes, commas and newlines inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++ } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',' || ch === ';') { row.push(cell); cell = '' }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(cell)
      if (row.some((c) => c.trim() !== '')) rows.push(row)
      row = []
      cell = ''
    } else cell += ch
  }
  row.push(cell)
  if (row.some((c) => c.trim() !== '')) rows.push(row)
  return rows
}
