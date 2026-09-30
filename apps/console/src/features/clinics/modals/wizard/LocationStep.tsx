import { Clock, Crosshair, MapPin } from '@phosphor-icons/react'
import { Field, ModalSection, SelectField, TextField, Toggle, ToggleRow } from '../../../../shared/ui'
import { DAYS, PROVINCES } from '../../config/labels'
import { parseRanges } from '../../lib/clinic-form'
import type { StepProps } from './shared'

export function LocationStep({ form, set }: StepProps) {
  const setHours = (key: string, text: string) => set({ hours: { ...form.hours, [key]: text } })
  return (
    <>
      <ModalSection label="Address">
        <Field label="Street address" htmlFor="cw-street" required><TextField id="cw-street" label="" hideLabel maxLength={160} value={form.address} onChange={(e) => set({ address: e.target.value })} /></Field>
        <div className="grid gap-3.5 min-[701px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_150px]">
          <Field label="Province" required><SelectField aria-label="Province" value={form.province} options={[{ value: '', label: 'Select province' }, ...PROVINCES.map((p) => ({ value: p, label: p }))]} onChange={(province) => set({ province })} /></Field>
          <Field label="City / regency" htmlFor="cw-city" required><TextField id="cw-city" label="" hideLabel maxLength={60} placeholder="e.g. Kota Surabaya" value={form.city} onChange={(e) => set({ city: e.target.value })} /></Field>
          <Field label="Postal code" htmlFor="cw-postal"><TextField id="cw-postal" label="" hideLabel inputMode="numeric" maxLength={5} value={form.postal_code} onChange={(e) => set({ postal_code: e.target.value.replace(/\D/g, '') })} /></Field>
        </div>
        <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-xl bg-[#dfe6da]" role="img" aria-label="Map pin">
          <span className="absolute inset-y-0 left-[30%] w-3 bg-[#cdd8c8]" /><span className="absolute inset-y-0 left-[72%] w-3 bg-[#cdd8c8]" /><span className="absolute inset-x-0 top-[38%] h-3 bg-[#cdd8c8]" /><span className="absolute inset-x-0 top-[78%] h-3 bg-[#cdd8c8]" />
          <MapPin size={34} weight="fill" className="relative text-primary" />
          <span className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-md bg-card px-2 py-1 text-11 font-semibold shadow-sm"><Crosshair size={12} />{form.lat && form.lng ? `${form.lat}, ${form.lng}` : 'No pin yet'}</span>
        </div>
        <div className="grid gap-3.5 min-[701px]:grid-cols-2">
          <Field label="Latitude" htmlFor="cw-lat" hint="e.g. -7.2892"><TextField id="cw-lat" label="" hideLabel inputMode="decimal" value={form.lat} onChange={(e) => set({ lat: e.target.value.replace(/[^\d.-]/g, '') })} /></Field>
          <Field label="Longitude" htmlFor="cw-lng" hint="e.g. 112.7381"><TextField id="cw-lng" label="" hideLabel inputMode="decimal" value={form.lng} onChange={(e) => set({ lng: e.target.value.replace(/[^\d.-]/g, '') })} /></Field>
        </div>
      </ModalSection>

      <ModalSection label="Opening hours">
        <div className="flex flex-col gap-2.5">
          {DAYS.map((d) => {
            const text = form.hours[d.key] ?? ''
            const on = text.trim() !== ''
            const invalid = on && parseRanges(text) === null
            return (
              <div key={d.key} className="flex items-center gap-3">
                <span className="flex w-20 flex-none items-center gap-2.5 text-13 font-bold"><Toggle label={`${d.label} open`} checked={on} onChange={(v) => setHours(d.key, v ? '08:00 – 20:00' : '')} />{d.label}</span>
                {on ? (
                  <TextField id={`cw-h-${d.key}`} label="" hideLabel aria-label={`${d.label} hours`} aria-invalid={invalid} className={invalid ? 'text-error' : undefined} placeholder="08:00 – 11:30 · 13:00 – 20:00" trailing={<Clock size={15} className="text-ink-faint" />} value={text} onChange={(e) => setHours(d.key, e.target.value)} />
                ) : (
                  <span className="flex h-12 flex-1 items-center rounded-control bg-surface px-3.5 text-13 font-semibold text-ink-muted">Closed</span>
                )}
              </div>
            )
          })}
        </div>
        <p className="m-0 text-11 text-ink-muted">Separate a lunch break with “·”, e.g. 08:00 – 11:30 · 13:00 – 20:00.</p>
      </ModalSection>

      <ModalSection label="Visits">
        <ToggleRow label="Walk-ins accepted" title="Walk-ins accepted" description="Otherwise booking via app or WhatsApp only" checked={form.walk_ins} onChange={(walk_ins) => set({ walk_ins })} />
        <ToggleRow label="Teleconsult available" title="Teleconsult available" description="Doctors can offer video consults through the app" checked={form.teleconsult} onChange={(teleconsult) => set({ teleconsult })} />
        <Field label="Parking / access notes" htmlFor="cw-access"><TextField id="cw-access" label="" hideLabel maxLength={200} value={form.access_notes} onChange={(e) => set({ access_notes: e.target.value })} /></Field>
      </ModalSection>
    </>
  )
}
