import { Buildings, CalendarX, Plus, Trash, VideoCamera } from '@phosphor-icons/react'
import { useState } from 'react'
import { Badge, Button, Field, ModalSection, SelectField, TextField, ToggleRow } from '../../../../shared/ui'
import { BOOKING_WINDOW, BUFFER_MINUTES, MIN_NOTICE, SLOT_MINUTES, TIMELINE_COLORS, WEEKDAYS } from '../../config/labels'
import { ensureVirtual, newId } from '../../lib/doctor-form'
import type { DoctorForm, DoctorsOptions, Location } from '../../types'
import { TimeInput } from './parts'

interface PracticeTabProps {
  form: DoctorForm
  setForm: (updater: (f: DoctorForm) => DoctorForm) => void
  options?: DoctorsOptions
}

const AXIS = { from: 7, to: 22 }
const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const minutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5))

const rangeText = (from: string, to: string) => {
  const a = new Date(from)
  const b = new Date(to)
  return from === to ? dateFmt.format(a) : `${a.getDate()} – ${dateFmt.format(b)}`
}

export function PracticeTab({ form, setForm, options }: PracticeTabProps) {
  const [clinicId, setClinicId] = useState('')
  const [off, setOff] = useState({ from: '', to: '', reason: '' })
  const setBooking = (patch: Partial<DoctorForm['booking']>) => setForm((f) => ({ ...f, booking: { ...f.booking, ...patch } }))
  const colorFor = (l: Location | undefined) => (l?.kind === 'virtual' ? TIMELINE_COLORS.virtual : l?.kind === 'primary' ? TIMELINE_COLORS.primary : TIMELINE_COLORS.secondary)
  const locOf = (id: string) => form.locations.find((l) => l.id === id)

  const addLocation = () => {
    const clinic = options?.clinics.find((c) => c.id === clinicId)
    if (!clinic || form.locations.some((l) => l.clinic_id === clinic.id)) return
    const kind: Location['kind'] = form.locations.some((l) => l.kind === 'primary') ? 'secondary' : 'primary'
    setForm((f) => ({ ...f, locations: [...f.locations, { id: newId(), clinic_id: clinic.id, kind, label: clinic.name, address: clinic.address, sip_number: null }] }))
    setClinicId('')
  }
  const removeLocation = (id: string) => setForm((f) => ({ ...f, locations: f.locations.filter((l) => l.id !== id), slots: f.slots.filter((s) => s.location_id !== id) }))
  const makePrimary = (id: string) => setForm((f) => ({ ...f, locations: f.locations.map((l) => (l.kind === 'virtual' ? l : { ...l, kind: l.id === id ? 'primary' : 'secondary' })) }))

  const addSlot = () =>
    setForm((f) => {
      const loc = f.locations.find((l) => l.kind === 'primary') ?? f.locations[0]
      if (loc) return { ...f, slots: [...f.slots, { location_id: loc.id, weekday: 1, start: '09:00', end: '13:00' }] }
      const v = ensureVirtual(f)
      return { ...v.form, slots: [...v.form.slots, { location_id: v.id, weekday: 1, start: '19:00', end: '21:00' }] }
    })

  return (
    <>
      <ModalSection label="Practice locations">
        <div className="flex flex-col gap-2.5">
          {form.locations.map((l) => (
            <div key={l.id} className="flex items-center gap-3 rounded-xl bg-surface px-3.5 py-3">
              <span className="inline-flex size-10 flex-none items-center justify-center rounded-lg border border-border bg-card" style={{ color: colorFor(l) }}>
                {l.kind === 'virtual' ? <VideoCamera size={18} /> : <Buildings size={18} />}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="flex flex-wrap items-center gap-2 text-13 font-bold">{l.label}<Badge tone={l.kind === 'primary' ? 'primary' : l.kind === 'virtual' ? 'warning' : 'info'}>{l.kind === 'primary' ? 'Primary' : l.kind === 'virtual' ? 'Virtual' : 'Secondary'}</Badge></span>
                <span className="text-12 text-ink-muted">{l.address ?? '—'}</span>
                {l.sip_number && <span className="font-mono text-11 text-ink-faint">{l.sip_number}</span>}
              </div>
              {l.kind === 'secondary' && <button type="button" className="text-11 font-bold text-primary" onClick={() => makePrimary(l.id)}>Make primary</button>}
              <button type="button" aria-label={`Remove ${l.label}`} className="inline-flex size-7 flex-none items-center justify-center text-ink-faint hover:text-error" onClick={() => removeLocation(l.id)}><Trash size={15} /></button>
            </div>
          ))}
          {!form.locations.some((l) => l.kind === 'virtual') && (
            <button type="button" className="inline-flex items-center gap-1.5 self-start text-12 font-bold text-primary" onClick={() => setForm((f) => ensureVirtual(f).form)}><VideoCamera size={13} /> Enable teleconsult (in-app)</button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="min-w-56 flex-1 max-w-96">
            <SelectField aria-label="Add a clinic" value={clinicId} options={[{ value: '', label: '+ Add location…' }, ...(options?.clinics ?? []).filter((c) => !form.locations.some((l) => l.clinic_id === c.id)).map((c) => ({ value: c.id, label: `${c.name} · ${c.city}` }))]} onChange={setClinicId} />
          </div>
          <Button variant="outline" onClick={addLocation} disabled={!clinicId}>Add location</Button>
        </div>
      </ModalSection>

      <ModalSection label="Weekly schedule">
        <ul className="m-0 flex list-none flex-wrap gap-4 p-0 text-11 text-ink-muted">
          {form.locations.map((l) => <li key={l.id} className="inline-flex items-center gap-1.5"><span className="size-2 rounded-[3px]" style={{ background: colorFor(l) }} />{l.label}</li>)}
        </ul>
        <div className="flex flex-col gap-1" role="img" aria-label="Weekly schedule">
          {WEEKDAYS.map((day, i) => (
            <div key={day} className="grid grid-cols-[40px_minmax(0,1fr)] items-center gap-2">
              <span className={form.slots.some((s) => s.weekday === i + 1) ? 'text-12 font-bold' : 'text-12 text-ink-faint'}>{day}</span>
              <div className="relative h-7 rounded-md bg-surface">
                {form.slots.filter((s) => s.weekday === i + 1).map((s, x) => {
                  const left = ((minutes(s.start) / 60 - AXIS.from) / (AXIS.to - AXIS.from)) * 100
                  const width = ((minutes(s.end) - minutes(s.start)) / 60 / (AXIS.to - AXIS.from)) * 100
                  return <span key={x} className="absolute top-0.5 bottom-0.5 flex items-center justify-center overflow-hidden rounded-md text-10 font-bold whitespace-nowrap text-white" style={{ left: `${Math.max(0, left)}%`, width: `${Math.max(2, width)}%`, background: colorFor(locOf(s.location_id)) }}>{s.start}–{s.end}</span>
                })}
              </div>
            </div>
          ))}
          <div className="grid grid-cols-[40px_minmax(0,1fr)] gap-2"><span /><div className="flex justify-between text-10 text-ink-faint">{[8, 10, 12, 14, 16, 18, 20].map((h) => <span key={h}>{String(h).padStart(2, '0')}:00</span>)}</div></div>
        </div>
        <div className="flex flex-col gap-2">
          {form.slots.map((s, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <div className="w-24"><SelectField aria-label="Day" value={String(s.weekday)} options={WEEKDAYS.map((d, x) => ({ value: String(x + 1), label: d }))} onChange={(v) => setForm((f) => ({ ...f, slots: f.slots.map((x, n) => (n === i ? { ...x, weekday: Number(v) } : x)) }))} /></div>
              <div className="min-w-44 flex-1"><SelectField aria-label="Location" value={s.location_id} options={form.locations.map((l) => ({ value: l.id, label: l.label }))} onChange={(v) => setForm((f) => ({ ...f, slots: f.slots.map((x, n) => (n === i ? { ...x, location_id: v } : x)) }))} /></div>
              <TimeInput label="Start" value={s.start} onChange={(start) => setForm((f) => ({ ...f, slots: f.slots.map((x, n) => (n === i ? { ...x, start } : x)) }))} />
              <TimeInput label="End" value={s.end} onChange={(end) => setForm((f) => ({ ...f, slots: f.slots.map((x, n) => (n === i ? { ...x, end } : x)) }))} />
              <button type="button" aria-label="Remove slot" className="inline-flex size-7 items-center justify-center text-ink-faint hover:text-error" onClick={() => setForm((f) => ({ ...f, slots: f.slots.filter((_, n) => n !== i) }))}><Trash size={15} /></button>
            </div>
          ))}
          <button type="button" className="inline-flex items-center gap-1 self-start text-12 font-bold text-primary" onClick={addSlot}><Plus size={12} weight="bold" /> Add time slot</button>
        </div>
        <div className="grid gap-3.5 min-[701px]:grid-cols-3">
          <Field label="Slot length"><SelectField aria-label="Slot length" value={String(form.booking.slot_minutes)} options={SLOT_MINUTES} onChange={(v) => setBooking({ slot_minutes: Number(v) })} /></Field>
          <Field label="Buffer between patients"><SelectField aria-label="Buffer" value={String(form.booking.buffer_minutes)} options={BUFFER_MINUTES} onChange={(v) => setBooking({ buffer_minutes: Number(v) })} /></Field>
          <Field label="Max patients / session" htmlFor="pr-max"><TextField id="pr-max" label="" hideLabel inputMode="numeric" value={String(form.booking.max_patients)} onChange={(e) => setBooking({ max_patients: Math.min(40, Math.max(1, Number(e.target.value.replace(/\D/g, '')) || 1)) })} /></Field>
        </div>
      </ModalSection>

      <ModalSection label="Time off">
        <div className="flex flex-col gap-2.5">
          {form.time_off.map((t, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl bg-warning-soft px-3.5 py-3">
              <CalendarX size={18} className="flex-none text-warning-ink" />
              <div className="flex min-w-0 flex-1 flex-col"><span className="text-13 font-bold">{rangeText(t.from, t.to)} · {t.reason}</span>{t.note && <span className="text-11 text-ink-muted">{t.note}</span>}</div>
              <button type="button" aria-label="Remove time off" className="inline-flex size-7 items-center justify-center text-ink-faint hover:text-error" onClick={() => setForm((f) => ({ ...f, time_off: f.time_off.filter((_, n) => n !== i) }))}><Trash size={15} /></button>
            </div>
          ))}
        </div>
        <div className="grid items-end gap-2.5 min-[701px]:grid-cols-[150px_150px_minmax(0,1fr)_auto]">
          <Field label="From"><input type="date" className="h-11 rounded-control border border-border bg-card px-3 text-13 font-semibold outline-0 focus-visible:border-primary" value={off.from} onChange={(e) => setOff({ ...off, from: e.target.value, to: off.to || e.target.value })} /></Field>
          <Field label="To"><input type="date" className="h-11 rounded-control border border-border bg-card px-3 text-13 font-semibold outline-0 focus-visible:border-primary" value={off.to} min={off.from} onChange={(e) => setOff({ ...off, to: e.target.value })} /></Field>
          <Field label="Reason" htmlFor="pr-reason"><TextField id="pr-reason" label="" hideLabel maxLength={100} placeholder="e.g. Conference" value={off.reason} onChange={(e) => setOff({ ...off, reason: e.target.value })} /></Field>
          <Button variant="outline" className="h-11" disabled={!off.from || !off.to || off.reason.trim().length < 2} onClick={() => { setForm((f) => ({ ...f, time_off: [...f.time_off, { from: off.from, to: off.to, reason: off.reason.trim(), note: null, is_auto: false }].sort((a, b) => a.from.localeCompare(b.from)) })); setOff({ from: '', to: '', reason: '' }) }}>Add leave</Button>
        </div>
      </ModalSection>

      <ModalSection label="Booking rules">
        <div className="grid gap-3.5 min-[701px]:grid-cols-2">
          <Field label="Booking window"><SelectField aria-label="Booking window" value={String(form.booking.window_days)} options={BOOKING_WINDOW} onChange={(v) => setBooking({ window_days: Number(v) })} /></Field>
          <Field label="Minimum notice"><SelectField aria-label="Minimum notice" value={String(form.booking.min_notice_hours)} options={MIN_NOTICE} onChange={(v) => setBooking({ min_notice_hours: Number(v) })} /></Field>
        </div>
        <ToggleRow label="Auto-confirm bookings" title="Auto-confirm bookings" description="Otherwise the clinic confirms each request" checked={form.booking.auto_confirm} onChange={(auto_confirm) => setBooking({ auto_confirm })} />
        <ToggleRow label="Allow same-day teleconsult" title="Allow same-day teleconsult" description="Patients can book open teleconsult slots today" checked={form.booking.same_day_tele} onChange={(same_day_tele) => setBooking({ same_day_tele })} />
      </ModalSection>
    </>
  )
}
