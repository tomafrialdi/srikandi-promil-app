import { Clock, Crosshair, MapPin } from '@phosphor-icons/react'
import { cn } from '../../../../shared/lib/cn'
import { Field, ModalSection, SelectField, TextField, Toggle, ToggleRow } from '../../../../shared/ui'
import { DAYS, PROVINCES } from '../../config/labels'
import { parseRanges } from '../../lib/clinic-form'
import type { StepProps } from './shared'

export function LocationStep({ form, set }: StepProps) {
  const setHours = (key: string, text: string) => set({ hours: { ...form.hours, [key]: text } })
  return (
    <>
      <ModalSection label="Address">
        <Field label="Street address" htmlFor="cw-street" required><TextField compact id="cw-street" label="" hideLabel maxLength={160} value={form.address} onChange={(e) => set({ address: e.target.value })} /></Field>
        <div className="grid gap-3.5 min-[701px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_140px]">
          <Field label="Province" required><SelectField triggerClassName="h-10 rounded-[10px]" aria-label="Province" value={form.province} options={[{ value: '', label: 'Select province' }, ...PROVINCES.map((p) => ({ value: p, label: p }))]} onChange={(province) => set({ province })} /></Field>
          <Field label="City / regency" htmlFor="cw-city" required><TextField compact id="cw-city" label="" hideLabel maxLength={60} placeholder="e.g. Kota Surabaya" value={form.city} onChange={(e) => set({ city: e.target.value })} /></Field>
          <Field label="Postal code" htmlFor="cw-postal"><TextField compact id="cw-postal" label="" hideLabel inputMode="numeric" maxLength={5} value={form.postal_code} onChange={(e) => set({ postal_code: e.target.value.replace(/\D/g, '') })} /></Field>
        </div>
        <div className="relative flex h-[200px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-[#dce5d6]" role="img" aria-label="Map pin">
          <span className="absolute inset-y-0 left-[30%] w-3 bg-[#c9d4c1]" /><span className="absolute inset-y-0 left-[72%] w-3 bg-[#c9d4c1]" /><span className="absolute inset-x-0 top-[38%] h-3 bg-[#c9d4c1]" /><span className="absolute inset-x-0 top-[78%] h-3 bg-[#c9d4c1]" />
          <MapPin size={36} weight="fill" className="relative text-primary" />
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-lg bg-white/90 px-2.5 py-1.5 text-11 font-bold"><Crosshair size={12} />{form.lat && form.lng ? `${form.lat}, ${form.lng}` : 'No pin yet'}</span>
        </div>
        <div className="grid gap-3.5 min-[701px]:grid-cols-2">
          <Field label="Latitude" htmlFor="cw-lat" hint="e.g. -7.2892"><TextField compact id="cw-lat" label="" hideLabel inputMode="decimal" value={form.lat} onChange={(e) => set({ lat: e.target.value.replace(/[^\d.-]/g, '') })} /></Field>
          <Field label="Longitude" htmlFor="cw-lng" hint="e.g. 112.7381"><TextField compact id="cw-lng" label="" hideLabel inputMode="decimal" value={form.lng} onChange={(e) => set({ lng: e.target.value.replace(/[^\d.-]/g, '') })} /></Field>
        </div>
      </ModalSection>

      <ModalSection label="Opening hours">
        <div className="flex flex-col gap-2">
          {DAYS.map((d) => {
            const text = form.hours[d.key] ?? ''
            const on = text.trim() !== ''
            const invalid = on && parseRanges(text) === null
            return (
              <div key={d.key} className="flex items-center gap-3">
                <span className={cn('flex w-24 flex-none items-center gap-2.5 text-13 font-bold', !on && 'text-ink-faint')}><Toggle size="md" label={`${d.label} open`} checked={on} onChange={(v) => setHours(d.key, v ? '08:00 – 20:00' : '')} />{d.label}</span>
                {on ? (
                  <div className="min-w-0 flex-1">
                    <TextField dense id={`cw-h-${d.key}`} label="" hideLabel aria-label={`${d.label} hours`} aria-invalid={invalid} className={invalid ? 'text-error' : undefined} placeholder="08:00 – 11:30 · 13:00 – 20:00" trailing={<Clock size={15} className="text-ink-faint" />} value={text} onChange={(e) => setHours(d.key, e.target.value)} />
                  </div>
                ) : (
                  <span className="flex h-[34px] flex-1 items-center rounded-lg border border-border bg-surface px-3 text-13 font-semibold">Closed</span>
                )}
              </div>
            )
          })}
        </div>
        <p className="m-0 text-11 font-medium text-ink-faint">Separate a lunch break with “·”, e.g. 08:00 – 11:30 · 13:00 – 20:00.</p>
      </ModalSection>

      <ModalSection label="Visits">
        <ToggleRow size="md" label="Walk-ins accepted" title={<span className="font-semibold">Walk-ins accepted</span>} description="Otherwise booking via app or WhatsApp only" checked={form.walk_ins} onChange={(walk_ins) => set({ walk_ins })} />
        <ToggleRow size="md" label="Teleconsult available" title={<span className="font-semibold">Teleconsult available</span>} description="Doctors can offer video consults through the app" checked={form.teleconsult} onChange={(teleconsult) => set({ teleconsult })} />
        <Field label="Parking / access notes" htmlFor="cw-access"><TextField compact id="cw-access" label="" hideLabel maxLength={200} value={form.access_notes} onChange={(e) => set({ access_notes: e.target.value })} /></Field>
      </ModalSection>
    </>
  )
}
