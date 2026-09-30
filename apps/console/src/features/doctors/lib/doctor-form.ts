import type { DoctorForm, DoctorFull, Location, Service } from '../types'
import { SERVICE_ORDER } from '../config/labels'

export function toForm(d: DoctorFull): DoctorForm {
  const services: Service[] = SERVICE_ORDER.map((kind) => d.services.find((s) => s.kind === kind) ?? { kind, price_idr: 0, bpjs: false, active: false })
  return {
    profile: {
      title: d.title, full_name: d.full_name, degree: d.degree ?? '', specialty_group: d.group, years_experience: d.years != null ? String(d.years) : '',
      focus: d.focus, bio: d.bio ?? '', photo_url: d.photo_url ?? '',
    },
    flags: { listed: d.listed, accepting: d.accepting, ...d.roles, bpjs: d.bpjs, languages: d.languages },
    locations: d.locations,
    slots: d.slots,
    time_off: d.time_off,
    booking: d.booking,
    services,
    payout: { paid_by: d.fee.paid_by, payout_schedule: d.fee.payout_schedule, discounts: d.discounts },
    permissions: d.permissions,
  }
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** Only the sections that changed, in the shape admin_doctors_update expects. */
export function buildPatch(original: DoctorForm, form: DoctorForm): Record<string, unknown> {
  const patch: Record<string, unknown> = {}
  if (!same(original.profile, form.profile)) patch.profile = { ...form.profile, years_experience: form.profile.years_experience }
  if (!same(original.flags, form.flags)) patch.flags = form.flags
  if (!same(original.locations, form.locations)) patch.locations = form.locations
  if (!same(original.slots, form.slots) || !same(original.locations, form.locations)) patch.slots = form.slots
  if (!same(original.time_off, form.time_off)) patch.time_off = form.time_off
  if (!same(original.booking, form.booking)) patch.booking = form.booking
  if (!same(original.services, form.services)) patch.services = form.services
  if (!same(original.payout, form.payout)) patch.payout = form.payout
  if (!same(original.permissions, form.permissions)) patch.permissions = form.permissions
  return patch
}

/** "3 unsaved changes": changed profile / flag fields plus one per changed list section. */
export function countChanges(original: DoctorForm, form: DoctorForm): number {
  const keys = (a: Record<string, unknown>, b: Record<string, unknown>) => Object.keys(b).filter((k) => !same(a[k], b[k])).length
  let n = keys(original.profile, form.profile) + keys(original.flags, form.flags) + keys(original.booking as never, form.booking as never)
  n += keys(original.payout as never, form.payout as never)
  for (const k of ['locations', 'slots', 'time_off', 'services', 'permissions'] as const) if (!same(original[k], form[k])) n += 1
  return n
}

let counter = 0
export const newId = () => `new-${++counter}`

export function ensureVirtual(form: DoctorForm): { form: DoctorForm; id: string } {
  const existing = form.locations.find((l) => l.kind === 'virtual')
  if (existing) return { form, id: existing.id }
  const loc: Location = { id: newId(), clinic_id: null, kind: 'virtual', label: 'Teleconsult (in-app)', address: 'Video & chat · Indonesia-wide', sip_number: null }
  return { form: { ...form, locations: [...form.locations, loc] }, id: loc.id }
}

export const initials = (name: string) => name.replace(/^(dr\.|Bdn\.|Prof\.)\s*/i, '').charAt(0).toUpperCase()

/* ── weekly schedule helpers (Profile tab shows one row per weekday) ───────────── */

export const firstSlot = (form: DoctorForm, weekday: number) => form.slots.find((s) => s.weekday === weekday)

export function setDay(form: DoctorForm, weekday: number, on: boolean): DoctorForm {
  if (!on) return { ...form, slots: form.slots.filter((s) => s.weekday !== weekday) }
  if (firstSlot(form, weekday)) return form
  const primary = form.locations.find((l) => l.kind === 'primary') ?? form.locations.find((l) => l.kind === 'secondary')
  let next = form
  let locationId = primary?.id
  if (!locationId) {
    const v = ensureVirtual(form)
    next = v.form
    locationId = v.id
  }
  return { ...next, slots: [...next.slots, { location_id: locationId, weekday, start: '09:00', end: '13:00' }].sort((a, b) => a.weekday - b.weekday || a.start.localeCompare(b.start)) }
}

export function setDayTime(form: DoctorForm, weekday: number, patch: { start?: string; end?: string }): DoctorForm {
  const first = firstSlot(form, weekday)
  return { ...form, slots: form.slots.map((s) => (s === first ? { ...s, ...patch } : s)) }
}

export function setDayMode(form: DoctorForm, weekday: number, mode: 'clinic' | 'tele'): DoctorForm {
  const first = firstSlot(form, weekday)
  if (!first) return form
  let next = form
  let target: string | undefined
  if (mode === 'tele') {
    const v = ensureVirtual(form)
    next = v.form
    target = v.id
  } else {
    target = (form.locations.find((l) => l.kind === 'primary') ?? form.locations.find((l) => l.kind === 'secondary'))?.id
  }
  if (!target) return form
  return { ...next, slots: next.slots.map((s) => (s === first ? { ...s, location_id: target! } : s)) }
}

export const isTele = (form: DoctorForm, locationId: string) => form.locations.find((l) => l.id === locationId)?.kind === 'virtual'
