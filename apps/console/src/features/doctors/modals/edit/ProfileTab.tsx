import { Camera, CheckCircle, Lock, ProhibitInset, Trash, Warning, WarningCircle } from '@phosphor-icons/react'
import { useRef, useState } from 'react'
import { Button, ChipToggleGroup, ConfirmDialog, Field, ModalSection, SelectField, TextAreaField, TextField, Toggle, ToggleRow, TimeRangeField, useToast } from '../../../../shared/ui'
import { cn } from '../../../../shared/lib/cn'
import { uploadImage } from '../../../../shared/services/imagekit.service'
import { DoctorAvatar } from '../../components/DoctorAvatar'
import { TITLES, WEEKDAYS } from '../../config/labels'
import { firstSlot, isTele, setDay, setDayMode, setDayTime } from '../../lib/doctor-form'
import { requestReverify } from '../../services/doctors.service'
import type { DoctorForm, DoctorFull, DoctorsOptions } from '../../types'
import { Segment } from './parts'

interface ProfileTabProps {
  doctor: DoctorFull
  form: DoctorForm
  setForm: (updater: (f: DoctorForm) => DoctorForm) => void
  options?: DoctorsOptions
  onSuspend: () => void
  onReload: () => void
}

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
const SELECT = 'h-10 rounded-[10px]'

export function ProfileTab({ doctor, form, setForm, options, onSuspend, onReload }: ProfileTabProps) {
  const toast = useToast()
  const [confirm, setConfirm] = useState(false)
  const p = form.profile
  const setP = (patch: Partial<DoctorForm['profile']>) => setForm((f) => ({ ...f, profile: { ...f.profile, ...patch } }))
  const setFlag = (patch: Partial<DoctorForm['flags']>) => setForm((f) => ({ ...f, flags: { ...f.flags, ...patch } }))
  const verified = doctor.str.status === 'verified'
  const rowItem = 'grid grid-cols-[16px_minmax(0,120px)_minmax(0,1fr)_16px] items-center gap-3 text-12'

  return (
    <>
      <ModalSection label="Profile">
        <div className="flex items-center gap-4">
          <DoctorAvatar name={doctor.name} url={p.photo_url || null} size={88} />
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              <PhotoButton label={p.photo_url ? 'Change photo' : 'Upload photo'} onPick={(url) => setP({ photo_url: url })} />
              {p.photo_url && <Button variant="outline" onClick={() => setP({ photo_url: '' })} leadingIcon={<Trash size={16} />}>Remove</Button>}
            </div>
            <span className="text-12 font-medium text-ink-muted">Approved photo · visible in app &amp; website</span>
          </div>
        </div>
        <div className="grid gap-3.5 min-[701px]:grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)]">
          <Field label="Title"><SelectField triggerClassName={SELECT} aria-label="Title" value={p.title} options={TITLES} onChange={(title) => setP({ title })} /></Field>
          <Field label="Full name" htmlFor="dp-name" required><TextField compact id="dp-name" label="" hideLabel value={p.full_name} onChange={(e) => setP({ full_name: e.target.value })} /></Field>
          <Field label="Degree / suffix" htmlFor="dp-degree"><TextField compact id="dp-degree" label="" hideLabel value={p.degree} onChange={(e) => setP({ degree: e.target.value })} /></Field>
        </div>
        <div className="grid gap-3.5 min-[701px]:grid-cols-[minmax(0,1fr)_180px]">
          <Field label="Specialty" required>
            <SelectField triggerClassName={SELECT} aria-label="Specialty" value={p.specialty_group} options={(options?.specialties ?? []).map((s) => ({ value: s.group, label: s.label }))} onChange={(v) => setP({ specialty_group: v as DoctorForm['profile']['specialty_group'] })} />
          </Field>
          <Field label="Years of experience" htmlFor="dp-years"><TextField compact id="dp-years" label="" hideLabel inputMode="numeric" value={p.years_experience} onChange={(e) => setP({ years_experience: e.target.value.replace(/\D/g, '').slice(0, 2) })} /></Field>
        </div>
        <Field label="Areas of focus" hint={`${p.focus.length} of 4`}>
          <ChipToggleGroup label="Areas of focus" options={options?.focus ?? []} selected={p.focus} onChange={(next) => next.length <= 4 && setP({ focus: next })} />
        </Field>
        <Field label="Short bio" htmlFor="dp-bio" hint={`${p.bio.length} / 280`}>
          <TextAreaField id="dp-bio" className="min-h-16 rounded-[10px] text-13 font-semibold" maxLength={280} value={p.bio} onChange={(e) => setP({ bio: e.target.value })} />
        </Field>
      </ModalSection>

      <ModalSection label="License">
        <div className={cn('flex flex-col gap-2.5 rounded-xl px-4 py-3.5', verified ? 'bg-success-soft' : 'bg-warning-soft')}>
          {[
            ['STR (KKI)', doctor.str.number ? `${doctor.str.number}${doctor.str.valid_until ? ` · valid to ${new Date(doctor.str.valid_until).getFullYear()}` : ''}` : 'Not provided'],
            ['SIP', doctor.sip.number ? `${doctor.sip.number}${doctor.sip.valid_until ? ` · valid to ${dateFmt.format(new Date(doctor.sip.valid_until))}` : ''}` : 'Not provided'],
            ...(doctor.cert.label ? [[doctor.cert.label, doctor.cert.verified_at ? `Verified ${dateFmt.format(new Date(doctor.cert.verified_at))}` : 'Not verified']] : []),
          ].map(([label, value]) => (
            <div key={label} className={rowItem}>
              {verified ? <CheckCircle size={15} weight="fill" className="text-success" /> : <WarningCircle size={15} weight="fill" className="text-warning-ink" />}
              <span className="font-bold">{label}</span>
              <span className="font-medium text-ink-muted">{value}</span>
              <Lock size={13} className="text-ink-faint" />
            </div>
          ))}
          <div className={cn('flex flex-wrap items-center justify-between gap-2 border-t pt-2.5 text-11 font-semibold', verified ? 'border-success/20 text-success' : 'border-warning/25 text-warning-ink')}>
            <span>{verified ? 'Verified fields are locked. Changing them triggers re-verification.' : `STR ${doctor.str.status} — verify it from “Verify STR (KKI)”.`}</span>
            {verified && <button type="button" className="text-12 font-bold" onClick={() => setConfirm(true)}>Request re-verify</button>}
          </div>
        </div>
      </ModalSection>

      <ModalSection label="Weekly schedule">
        <div className="flex flex-col gap-2">
          {WEEKDAYS.map((day, i) => {
            const slot = firstSlot(form, i + 1)
            const tele = slot ? isTele(form, slot.location_id) : false
            const more = form.slots.filter((s) => s.weekday === i + 1).length - 1
            return (
              <div key={day} className="flex min-h-10 flex-wrap items-center gap-3">
                <span className="flex w-[84px] flex-none items-center gap-2.5">
                  <Toggle size="sm" label={`${day} available`} checked={!!slot} onChange={(on) => setForm((f) => setDay(f, i + 1, on))} />
                  <span className={cn('text-13 font-bold', !slot && 'text-ink-faint')}>{day}</span>
                </span>
                {slot ? (
                  <>
                    <div className="w-[170px]"><TimeRangeField aria-label={`${day} hours`} className="h-10 rounded-[10px]" value={{ start: slot.start, end: slot.end }} onChange={(range) => setForm((f) => setDayTime(f, i + 1, range))} /></div>
                    <Segment label={`${day} mode`} value={tele ? 'tele' : 'clinic'} options={[{ value: 'clinic', label: 'In clinic', tone: 'var(--primary)' }, { value: 'tele', label: 'Teleconsult', tone: 'var(--secondary)' }]} onChange={(m) => setForm((f) => setDayMode(f, i + 1, m))} />
                    {more > 0 && <span className="text-11 text-ink-faint">+{more} more in Practice &amp; schedule</span>}
                  </>
                ) : (
                  <span className="text-12 font-medium text-ink-faint">Not available</span>
                )}
              </div>
            )
          })}
        </div>
      </ModalSection>

      <ModalSection label="Visibility & roles">
        <div className="grid gap-x-8 gap-y-3 min-[701px]:grid-cols-2">
          <div className="flex flex-col gap-3">
            <ToggleRow size="md" label="Listed in Find a specialist" title={<span className="font-semibold">Listed in Find a specialist</span>} description="Public profile in app & web" checked={form.flags.listed} onChange={(listed) => setFlag({ listed })} />
            <ToggleRow size="md" label="Accepting new patients" title={<span className="font-semibold">Accepting new patients</span>} description="Shows “Book” button" checked={form.flags.accepting} onChange={(accepting) => setFlag({ accepting })} />
          </div>
          <div className="flex flex-col gap-3">
            <ToggleRow size="md" label="Medical reviewer" title={<span className="font-semibold">Medical reviewer</span>} description="Can approve articles & meds" checked={form.flags.medical_reviewer} onChange={(medical_reviewer) => setFlag({ medical_reviewer })} />
            <ToggleRow size="md" label="Engine sign-off" title={<span className="font-semibold">Engine sign-off</span>} description="Required approver for rule changes" checked={form.flags.engine_signoff} onChange={(engine_signoff) => setFlag({ engine_signoff })} />
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-error-soft px-4 py-3.5">
          <Warning size={16} className="flex-none text-error" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-13 font-bold text-error">{doctor.status === 'suspended' ? 'Doctor is suspended' : 'Suspend or unlist doctor'}</span>
            <span className="text-12 font-medium text-error">{doctor.status === 'suspended' ? 'Reactivate to show the profile again.' : 'Hides profile immediately. Existing bookings are notified.'}</span>
          </div>
          <Button variant="danger" onClick={onSuspend} leadingIcon={<ProhibitInset size={16} />}>{doctor.status === 'suspended' ? 'Reactivate' : 'Suspend'}</Button>
        </div>
      </ModalSection>

      <ConfirmDialog open={confirm} onClose={() => setConfirm(false)} title="Request re-verification?" description="The STR goes back to “pending” until it is checked with KKI again. The profile stays live meanwhile." confirmLabel="Request re-verify"
        onConfirm={async () => { await requestReverify(doctor.id); toast({ title: 'Re-verification requested' }); onReload() }} />
    </>
  )
}

/** "Change photo" button: picks an image and uploads it to ImageKit. */
function PhotoButton({ label, onPick }: { label: string; onPick: (url: string) => void }) {
  const toast = useToast()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const upload = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return toast({ title: 'Choose an image file' })
    if (file.size > 10 * 1024 * 1024) return toast({ title: 'Image must be 10 MB or smaller' })
    setBusy(true)
    try {
      onPick((await uploadImage(file, '/doctors')).url)
    } catch (err) {
      toast({ title: 'Upload failed', description: err instanceof Error ? err.message : 'Try again.' })
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <>
      <Button variant="outline" disabled={busy} onClick={() => input.current?.click()} leadingIcon={<Camera size={16} />}>{busy ? 'Uploading…' : label}</Button>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => void upload(e.target.files?.[0])} />
    </>
  )
}
