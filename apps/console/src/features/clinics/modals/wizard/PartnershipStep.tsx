import { CheckCircle, QrCode, WarningCircle } from '@phosphor-icons/react'
import { Field, ModalSection, RadioCard, SelectField, TextField, ToggleRow, CheckRow } from '../../../../shared/ui'
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
          {TIERS.map((t) => (
            <RadioCard key={t.value} name="cw-tier" selected={form.tier === t.value} onSelect={() => set({ tier: t.value })} title={t.title} description={`${t.price} · ${t.detail}`} />
          ))}
        </div>
      </ModalSection>

      <ModalSection label="Referrals & bookings">
        <ToggleRow label="Accept bookings from the app" title="Accept bookings from the app" description="Users can request slots; clinic confirms within 24h" checked={form.accepts_bookings} onChange={(accepts_bookings) => set({ accepts_bookings })} />
        <ToggleRow label="Referral QR code for waiting room" title="Referral QR code for waiting room" description="Tracks installs as “Clinic referral”" checked={form.referral_enabled} onChange={(referral_enabled) => set({ referral_enabled })} />
        {form.referral_enabled && (
          <div className="flex items-center gap-3.5 rounded-xl bg-surface px-3.5 py-3">
            <span className="inline-flex size-12 flex-none items-center justify-center rounded-lg border border-border bg-card"><QrCode size={30} /></span>
            <span className="flex min-w-0 flex-col"><span className="truncate font-mono text-13 font-bold">srikandi.app/c/{slug}</span><span className="text-11 text-ink-muted">Generated after publish · printable A5 poster</span></span>
          </div>
        )}
      </ModalSection>

      <ModalSection label="Clinic admin access">
        <div className="grid gap-3.5 min-[701px]:grid-cols-[minmax(0,1fr)_200px]">
          <Field label="Clinic admin email" htmlFor="cw-admin" required><TextField id="cw-admin" label="" hideLabel type="email" maxLength={120} placeholder="admin@clinic.id" value={form.admin_email} onChange={(e) => set({ admin_email: e.target.value })} /></Field>
          <Field label="Role"><SelectField aria-label="Admin role" value={form.admin_role} options={ADMIN_ROLES} onChange={(v) => set({ admin_role: v as typeof form.admin_role })} /></Field>
        </div>
      </ModalSection>

      <ModalSection label="Checklist">
        <ul className="m-0 flex list-none flex-col gap-2.5 rounded-xl bg-surface px-4 py-3.5 text-13 font-medium">
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
