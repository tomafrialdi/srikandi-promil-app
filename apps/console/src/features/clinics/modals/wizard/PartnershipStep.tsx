import { CheckCircle, QrCode, WarningCircle } from '@phosphor-icons/react'
import { cn } from '../../../../shared/lib/cn'
import { Field, ModalSection, SelectField, TextField, ToggleRow, CheckRow } from '../../../../shared/ui'
import { ADMIN_ROLES, TIERS } from '../../config/labels'
import { slugOf } from '../../lib/clinic-form'
import type { ClinicFull } from '../../types'
import type { StepProps } from './shared'

export function PartnershipStep({ form, set, clinic }: StepProps & { clinic: ClinicFull | undefined }) {
  const slug = clinic?.referral_slug ?? slugOf(form.name)
  return (
    <>
      <ModalSection label="Listing tier">
        <div className="grid gap-3 min-[701px]:grid-cols-3">
          {TIERS.map((t) => {
            const on = form.tier === t.value
            return (
              <label key={t.value} className={cn('relative flex cursor-pointer flex-col gap-1.5 rounded-xl border p-3.5', on ? 'border-primary bg-primary-soft' : 'border-border bg-card')}>
                <input type="radio" className="peer absolute inset-0 m-0 cursor-pointer opacity-0" name="cw-tier" checked={on} onChange={() => set({ tier: t.value })} />
                <span className="flex items-center justify-between gap-2">
                  <span className={cn('text-14 font-extrabold', on && 'text-primary')}>{t.title}</span>
                  <span className={cn('size-[18px] flex-none rounded-full bg-card peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary', on ? 'border-[5px] border-primary' : 'border-[1.5px] border-border')} aria-hidden="true" />
                </span>
                <span className="text-13 font-bold">{t.price}</span>
                <span className="text-11 leading-snug font-medium text-ink-muted">{t.detail}</span>
              </label>
            )
          })}
        </div>
      </ModalSection>

      <ModalSection label="Referrals & bookings">
        <ToggleRow size="md" label="Accept bookings from the app" title={<span className="font-semibold">Accept bookings from the app</span>} description="Users can request slots; clinic confirms within 24h" checked={form.accepts_bookings} onChange={(accepts_bookings) => set({ accepts_bookings })} />
        <ToggleRow size="md" label="Referral QR code for waiting room" title={<span className="font-semibold">Referral QR code for waiting room</span>} description="Tracks installs as “Clinic referral”" checked={form.referral_enabled} onChange={(referral_enabled) => set({ referral_enabled })} />
        {form.referral_enabled && (
          <div className="flex items-center gap-3.5 rounded-xl bg-surface p-3.5">
            <span className="inline-flex size-14 flex-none items-center justify-center rounded-lg border border-border bg-card"><QrCode size={36} /></span>
            <span className="flex min-w-0 flex-col gap-0.5"><span className="truncate text-13 font-bold">srikandi.app/c/{slug}</span><span className="text-11 font-medium text-ink-muted">Generated after publish · printable A5 poster</span></span>
          </div>
        )}
      </ModalSection>

      <ModalSection label="Clinic admin access">
        <div className="grid gap-3.5 min-[701px]:grid-cols-[minmax(0,1fr)_200px]">
          <Field label="Clinic admin email" htmlFor="cw-admin" required><TextField compact id="cw-admin" label="" hideLabel type="email" maxLength={120} placeholder="admin@clinic.id" value={form.admin_email} onChange={(e) => set({ admin_email: e.target.value })} /></Field>
          <Field label="Role"><SelectField triggerClassName="h-10 rounded-[10px]" aria-label="Admin role" value={form.admin_role} options={ADMIN_ROLES} onChange={(v) => set({ admin_role: v as typeof form.admin_role })} /></Field>
        </div>
      </ModalSection>

      <ModalSection label="Checklist">
        <ul className="m-0 flex list-none flex-col gap-2.5 rounded-xl bg-surface p-3.5 text-13 font-semibold">
          {(clinic?.checklist ?? []).filter((i) => i.key !== 'terms').map((i) => (
            <li key={i.key} className={`flex items-center gap-2.5 ${i.ok ? '' : 'text-error'}`}>
              {i.ok ? <CheckCircle size={16} className="flex-none text-success" /> : <WarningCircle size={16} className="flex-none" />}
              {i.label}
            </li>
          ))}
        </ul>
        <CheckRow checked={form.terms_signed} onChange={(terms_signed) => set({ terms_signed })} title="Terms & data-processing agreement signed" description="Tick once the signed agreement is on file" />
      </ModalSection>
    </>
  )
}
