import { Lock, ProhibitInset, Trash, Warning } from '@phosphor-icons/react'
import { useState } from 'react'
import { Button, ChipToggleGroup, ConfirmDialog, Field, ImageUpload, ModalSection, SelectField, TextAreaField, TextField, Toggle, ToggleRow, useToast } from '../../../../shared/ui'
import { DoctorAvatar } from '../../components/DoctorAvatar'
import { TITLES, WEEKDAYS } from '../../config/labels'
import { firstSlot, isTele, setDay, setDayMode, setDayTime } from '../../lib/doctor-form'
import { requestReverify } from '../../services/doctors.service'
import type { DoctorForm, DoctorFull, DoctorsOptions } from '../../types'
import { Segment, TimeInput } from './parts'

interface ProfileTabProps {
  doctor: DoctorFull
  form: DoctorForm
  setForm: (updater: (f: DoctorForm) => DoctorForm) => void
  options?: DoctorsOptions
  onSuspend: () => void
  onReload: () => void
}

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

export function ProfileTab({ doctor, form, setForm, options, onSuspend, onReload }: ProfileTabProps) {
  const toast = useToast()
  const [confirm, setConfirm] = useState(false)
  const p = form.profile
  const setP = (patch: Partial<DoctorForm['profile']>) => setForm((f) => ({ ...f, profile: { ...f.profile, ...patch } }))
  const setFlag = (patch: Partial<DoctorForm['flags']>) => setForm((f) => ({ ...f, flags: { ...f.flags, ...patch } }))

  return (
    <>
      <ModalSection label="Profile">
        <div className="flex items-center gap-4">
          <div className="w-24 flex-none">
            {p.photo_url ? <DoctorAvatar name={doctor.name} url={p.photo_url} size={96} /> : <ImageUpload value={null} folder="/doctors" label="Upload" aspectClassName="aspect-square" onChange={(img) => setP({ photo_url: img?.url ?? '' })} />}
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <ImageUploadButton onPick={(url) => setP({ photo_url: url })} />
              {p.photo_url && <Button variant="outline" onClick={() => setP({ photo_url: '' })} leadingIcon={<Trash size={15} />}>Remove</Button>}
            </div>
            <span className="text-12 text-ink-muted">Approved photo · visible in app &amp; website</span>
          </div>
        </div>
        <div className="grid gap-3.5 min-[701px]:grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)]">
          <Field label="Title"><SelectField aria-label="Title" value={p.title} options={TITLES} onChange={(title) => setP({ title })} /></Field>
          <Field label="Full name" htmlFor="dp-name" required><TextField id="dp-name" label="" hideLabel value={p.full_name} onChange={(e) => setP({ full_name: e.target.value })} /></Field>
          <Field label="Degree / suffix" htmlFor="dp-degree"><TextField id="dp-degree" label="" hideLabel value={p.degree} onChange={(e) => setP({ degree: e.target.value })} /></Field>
        </div>
        <div className="grid gap-3.5 min-[701px]:grid-cols-[minmax(0,1fr)_200px]">
          <Field label="Specialty" required>
            <SelectField aria-label="Specialty" value={p.specialty_group} options={(options?.specialties ?? []).map((s) => ({ value: s.group, label: s.label }))} onChange={(v) => setP({ specialty_group: v as DoctorForm['profile']['specialty_group'] })} />
          </Field>
          <Field label="Years of experience" htmlFor="dp-years"><TextField id="dp-years" label="" hideLabel inputMode="numeric" value={p.years_experience} onChange={(e) => setP({ years_experience: e.target.value.replace(/\D/g, '').slice(0, 2) })} /></Field>
        </div>
        <Field label="Areas of focus" hint={`${p.focus.length} of 4`}>
          <ChipToggleGroup label="Areas of focus" options={options?.focus ?? []} selected={p.focus} onChange={(next) => next.length <= 4 && setP({ focus: next })} />
        </Field>
        <Field label="Short bio" htmlFor="dp-bio" hint={`${p.bio.length} / 280`}>
          <TextAreaField id="dp-bio" maxLength={280} value={p.bio} onChange={(e) => setP({ bio: e.target.value })} />
        </Field>
      </ModalSection>

      <ModalSection label="License">
        <div className={doctor.str.status === 'verified' ? 'flex flex-col gap-2.5 rounded-xl bg-success-soft px-3.5 py-3' : 'flex flex-col gap-2.5 rounded-xl bg-warning-soft px-3.5 py-3'}>
          {[
            ['STR (KKI)', doctor.str.number ? `${doctor.str.number}${doctor.str.valid_until ? ` · valid to ${new Date(doctor.str.valid_until).getFullYear()}` : ''}` : 'Not provided'],
            ['SIP', doctor.sip.number ? `${doctor.sip.number}${doctor.sip.valid_until ? ` · valid to ${dateFmt.format(new Date(doctor.sip.valid_until))}` : ''}` : 'Not provided'],
            ...(doctor.cert.label ? [[doctor.cert.label, doctor.cert.verified_at ? `Verified ${dateFmt.format(new Date(doctor.cert.verified_at))}` : 'Not verified']] : []),
          ].map(([label, value]) => (
            <div key={label} className="grid grid-cols-[minmax(0,130px)_minmax(0,1fr)_16px] items-center gap-3 text-12">
              <span className="font-bold">{label}</span>
              <span className="text-ink-muted">{value}</span>
              <Lock size={13} className="text-ink-faint" />
            </div>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-2 text-11 font-semibold" style={{ color: doctor.str.status === 'verified' ? 'var(--success)' : 'var(--warning-ink)' }}>
            <span>{doctor.str.status === 'verified' ? 'Verified fields are locked. Changing them triggers re-verification.' : `STR ${doctor.str.status} — verify it from “Verify STR (KKI)”.`}</span>
            {doctor.str.status === 'verified' && <button type="button" className="font-bold text-primary" onClick={() => setConfirm(true)}>Request re-verify</button>}
          </div>
        </div>
      </ModalSection>

      <ModalSection label="Weekly schedule">
        <div className="flex flex-col gap-2.5">
          {WEEKDAYS.map((day, i) => {
            const slot = firstSlot(form, i + 1)
            const tele = slot ? isTele(form, slot.location_id) : false
            return (
              <div key={day} className="flex flex-wrap items-center gap-3">
                <span className="flex w-16 items-center gap-2.5 text-13 font-bold"><Toggle label={`${day} available`} checked={!!slot} onChange={(on) => setForm((f) => setDay(f, i + 1, on))} />{day}</span>
                {slot ? (
                  <>
                    <span className="flex items-center gap-1.5">
                      <TimeInput label={`${day} start`} value={slot.start} onChange={(start) => setForm((f) => setDayTime(f, i + 1, { start }))} />
                      <span className="text-ink-faint">–</span>
                      <TimeInput label={`${day} end`} value={slot.end} onChange={(end) => setForm((f) => setDayTime(f, i + 1, { end }))} />
                    </span>
                    <Segment label={`${day} mode`} value={tele ? 'tele' : 'clinic'} options={[{ value: 'clinic', label: 'In clinic', tone: 'var(--primary)' }, { value: 'tele', label: 'Teleconsult', tone: 'var(--secondary)' }]} onChange={(m) => setForm((f) => setDayMode(f, i + 1, m))} />
                    {form.slots.filter((s) => s.weekday === i + 1).length > 1 && <span className="text-11 text-ink-faint">+{form.slots.filter((s) => s.weekday === i + 1).length - 1} more in Practice &amp; schedule</span>}
                  </>
                ) : (
                  <span className="text-12 text-ink-faint">Not available</span>
                )}
              </div>
            )
          })}
        </div>
      </ModalSection>

      <ModalSection label="Visibility & roles">
        <div className="grid gap-x-8 gap-y-3.5 min-[701px]:grid-cols-2">
          <ToggleRow label="Listed in Find a specialist" title="Listed in Find a specialist" description="Public profile in app & web" checked={form.flags.listed} onChange={(listed) => setFlag({ listed })} />
          <ToggleRow label="Medical reviewer" title="Medical reviewer" description="Can approve articles & meds" checked={form.flags.medical_reviewer} onChange={(medical_reviewer) => setFlag({ medical_reviewer })} />
          <ToggleRow label="Accepting new patients" title="Accepting new patients" description="Shows “Book” button" checked={form.flags.accepting} onChange={(accepting) => setFlag({ accepting })} />
          <ToggleRow label="Engine sign-off" title="Engine sign-off" description="Required approver for rule changes" checked={form.flags.engine_signoff} onChange={(engine_signoff) => setFlag({ engine_signoff })} />
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-error-soft px-3.5 py-3">
          <Warning size={18} className="flex-none text-error" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-13 font-bold text-error">{doctor.status === 'suspended' ? 'Doctor is suspended' : 'Suspend or unlist doctor'}</span>
            <span className="text-12 text-error/80">{doctor.status === 'suspended' ? 'Reactivate to show the profile again.' : 'Hides profile immediately. Existing bookings are notified.'}</span>
          </div>
          <Button variant="danger" className="bg-card" onClick={onSuspend} leadingIcon={<ProhibitInset size={16} />}>{doctor.status === 'suspended' ? 'Reactivate' : 'Suspend'}</Button>
        </div>
      </ModalSection>

      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} title="Request re-verification?" description="The STR goes back to “pending” until it is checked with KKI again. The profile stays live meanwhile." confirmLabel="Request re-verify"
        onConfirm={async () => { await requestReverify(doctor.id); toast({ title: 'Re-verification requested' }); onReload() }} />
    </>
  )
}

/** Small "Change photo" button that uploads to ImageKit. */
function ImageUploadButton({ onPick }: { onPick: (url: string) => void }) {
  return (
    <div className="w-32">
      <ImageUpload value={null} folder="/doctors" label="Change photo" aspectClassName="aspect-[3/1]" onChange={(img) => img && onPick(img.url)} />
    </div>
  )
}
