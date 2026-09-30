import { Buildings, FloppyDisk, MagnifyingGlass, ShieldCheck, UploadSimple, UserPlus, VideoCamera, Warning } from '@phosphor-icons/react'
import { useState } from 'react'
import { Button, ChipToggleGroup, Field, ImageUpload, Modal, ModalFooter, ModalSection, Notice, SelectField, TextField, Toggle, useToast, DateField } from '../../../shared/ui'
import { TITLES } from '../config/labels'
import { createDoctor } from '../services/doctors.service'
import type { DoctorsOptions } from '../types'

interface AddDoctorModalProps {
  open: boolean
  onClose: () => void
  options?: DoctorsOptions
  onCreated: (id: string) => void
}

const ROLE_CHIPS = [
  { value: 'listed', label: 'Listed in Find a specialist' },
  { value: 'medical_reviewer', label: 'Medical reviewer' },
  { value: 'engine_signoff', label: 'Engine sign-off' },
  { value: 'community_expert', label: 'Community expert' },
]

const digits = (v: string) => Number(v.replace(/\D/g, '')) || 0
const fmt = (n: number) => (n ? new Intl.NumberFormat('id-ID').format(n) : '')

/** Mount with a key per opening so the form starts empty. */
export function AddDoctorModal({ open, onClose, options, onCreated }: AddDoctorModalProps) {
  const toast = useToast()
  const [f, setF] = useState({
    title: 'dr.', full_name: '', degree: '', specialty_group: '', years_experience: '', focus: [] as string[], photo_url: '',
    str_number: '', sip_number: '', sip_valid_until: '', clinic_id: '', clinic_on: false, clinic_fee: 0, tele_on: false, tele_fee: 0,
    languages: ['Bahasa Indonesia'], accepts_bpjs: false, roles: ['listed'] as string[],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (patch: Partial<typeof f>) => setF((s) => ({ ...s, ...patch }))

  const draftIssue = f.full_name.trim().length < 2 ? 'Enter the full name' : !f.specialty_group ? 'Pick a specialty' : null
  const addIssue = draftIssue ?? (f.str_number.replace(/\D/g, '').length < 10 ? 'Enter the STR number' : f.clinic_on && !f.clinic_id ? 'Pick the primary practice location' : null)

  const save = async (draft: boolean) => {
    setSaving(true)
    setError(null)
    try {
      const id = await createDoctor(
        {
          title: f.title, full_name: f.full_name.trim(), degree: f.degree.trim(), specialty_group: f.specialty_group, years_experience: f.years_experience,
          focus: f.focus, photo_url: f.photo_url, str_number: f.str_number, sip_number: f.sip_number, sip_valid_until: f.sip_valid_until,
          clinic_id: f.clinic_on ? f.clinic_id : '', clinic_fee: f.clinic_on ? f.clinic_fee : 0, tele_fee: f.tele_on ? f.tele_fee : 0,
          languages: f.languages, accepts_bpjs: f.accepts_bpjs,
          listed: f.roles.includes('listed'), medical_reviewer: f.roles.includes('medical_reviewer'), engine_signoff: f.roles.includes('engine_signoff'), community_expert: f.roles.includes('community_expert'),
        },
        draft,
      )
      toast({ title: draft ? 'Saved as draft' : 'Doctor added', description: draft ? f.full_name : 'The profile goes live after the STR is verified.' })
      onCreated(id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the doctor.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      size="lg"
      icon={<UserPlus size={20} />}
      title="Add doctor"
      subtitle="Profile goes live after STR is verified with KKI and a clinic confirms practice."
      footer={
        <ModalFooter info="Status after save: Pending verification">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="outline" onClick={() => save(true)} disabled={saving || draftIssue !== null} title={draftIssue ?? undefined} leadingIcon={<FloppyDisk size={16} />}>Save as draft</Button>
          <Button onClick={() => save(false)} disabled={saving || addIssue !== null} title={addIssue ?? undefined} leadingIcon={<UserPlus size={16} color="#fff" />}>{saving ? 'Saving…' : 'Add doctor'}</Button>
        </ModalFooter>
      }
    >
      {error && <Notice tone="error" icon={<Warning size={16} />}>{error}</Notice>}
      <ModalSection label="Profile">
        <div className="flex items-center gap-4">
          <div className="w-28 flex-none"><ImageUpload value={f.photo_url || null} folder="/doctors" label="Upload" aspectClassName="aspect-square" onChange={(img) => set({ photo_url: img?.url ?? '' })} /></div>
          <div className="flex flex-col gap-1"><span className="text-13 font-bold">Profile photo</span><span className="text-12 text-ink-muted">Square JPG/PNG, min 400×400. Professional photo, face clearly visible. Shown in app &amp; website.</span></div>
        </div>
        <div className="grid gap-3.5 min-[701px]:grid-cols-[110px_minmax(0,1fr)_minmax(0,1fr)]">
          <Field label="Title"><SelectField aria-label="Title" value={f.title} options={TITLES} onChange={(title) => set({ title })} /></Field>
          <Field label="Full name" htmlFor="ad-name" required><TextField id="ad-name" label="" hideLabel placeholder="e.g. Sarah Lestari" value={f.full_name} onChange={(e) => set({ full_name: e.target.value })} /></Field>
          <Field label="Degree / suffix" htmlFor="ad-degree"><TextField id="ad-degree" label="" hideLabel placeholder="e.g. SpOG-KFER" value={f.degree} onChange={(e) => set({ degree: e.target.value })} /></Field>
        </div>
        <div className="grid gap-3.5 min-[701px]:grid-cols-[minmax(0,1fr)_200px]">
          <Field label="Specialty" required><SelectField aria-label="Specialty" value={f.specialty_group} options={[{ value: '', label: 'Select specialty' }, ...(options?.specialties ?? []).map((s) => ({ value: s.group, label: s.label }))]} onChange={(specialty_group) => set({ specialty_group })} /></Field>
          <Field label="Years of experience" htmlFor="ad-years"><TextField id="ad-years" label="" hideLabel inputMode="numeric" placeholder="e.g. 12" value={f.years_experience} onChange={(e) => set({ years_experience: e.target.value.replace(/\D/g, '').slice(0, 2) })} /></Field>
        </div>
        <Field label="Areas of focus" hint="Pick up to 4"><ChipToggleGroup label="Areas of focus" options={options?.focus ?? []} selected={f.focus} onChange={(next) => next.length <= 4 && set({ focus: next })} /></Field>
      </ModalSection>

      <ModalSection label="License verification">
        <Field label="STR number" htmlFor="ad-str" required>
          <div className="flex gap-2.5">
            <TextField id="ad-str" label="" hideLabel className="font-mono" placeholder="16-digit STR from KKI" value={f.str_number} onChange={(e) => set({ str_number: e.target.value.replace(/[^\d ]/g, '').slice(0, 24) })} />
            <Button className="h-12 flex-none bg-secondary" disabled title="KKI has no public API. The STR is verified from “Verify STR (KKI)” after the doctor is added." leadingIcon={<ShieldCheck size={16} color="#fff" />}>Verify with KKI</Button>
          </div>
        </Field>
        <div className="grid gap-3.5 min-[701px]:grid-cols-2">
          <Field label="SIP number" htmlFor="ad-sip" required><TextField id="ad-sip" label="" hideLabel placeholder="Practice license number" maxLength={60} value={f.sip_number} onChange={(e) => set({ sip_number: e.target.value })} /></Field>
          <Field label="SIP valid until"><DateField aria-label="SIP valid until" className="h-12 text-14" value={f.sip_valid_until} onChange={(sip_valid_until) => set({ sip_valid_until })} /></Field>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-surface px-3.5 py-3 text-12">
          <UploadSimple size={20} className="flex-none text-ink-muted" />
          <span className="flex min-w-0 flex-1 flex-col"><span className="text-13 font-bold">Upload STR, SIP &amp; sub-specialist certificate</span><span className="text-ink-muted">PDF or image · max 10 MB each · stored encrypted</span></span>
          <Button variant="outline" disabled title="Encrypted document storage is not set up yet">Browse</Button>
        </div>
      </ModalSection>

      <ModalSection label="Practice & consultation">
        <Field label="Primary practice location" required>
          <div className="relative">
            <SelectField aria-label="Primary practice location" value={f.clinic_id} options={[{ value: '', label: 'Search clinic or hospital…' }, ...(options?.clinics ?? []).map((c) => ({ value: c.id, label: `${c.name} · ${c.city}` }))]} onChange={(clinic_id) => set({ clinic_id, clinic_on: clinic_id ? true : f.clinic_on })} />
            <MagnifyingGlass size={14} className="pointer-events-none absolute top-1/2 right-9 -translate-y-1/2 text-ink-faint" />
          </div>
        </Field>
        <div className="grid gap-3.5 min-[701px]:grid-cols-2">
          {[
            { key: 'clinic', icon: Buildings, title: 'In-clinic consult', on: f.clinic_on, fee: f.clinic_fee },
            { key: 'tele', icon: VideoCamera, title: 'Teleconsult (video / chat)', on: f.tele_on, fee: f.tele_fee },
          ].map(({ key, icon: Glyph, title, on, fee }) => (
            <div key={key} className="flex flex-col gap-2.5 rounded-xl bg-surface px-3.5 py-3">
              <div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-13 font-bold"><Glyph size={16} className="text-ink-muted" />{title}</span><Toggle label={title} checked={on} onChange={(v) => set(key === 'clinic' ? { clinic_on: v } : { tele_on: v })} /></div>
              <Field label="Fee">
                <span className="flex h-11 items-center gap-1.5 rounded-control border border-border bg-card px-3 text-13 font-semibold focus-within:border-primary">
                  <span className="text-ink-faint">Rp</span>
                  <input aria-label={`${title} fee`} inputMode="numeric" disabled={!on} placeholder="0" className="min-w-0 flex-1 border-0 bg-transparent outline-0 disabled:opacity-50" value={fmt(fee)} onChange={(e) => set(key === 'clinic' ? { clinic_fee: Math.min(50_000_000, digits(e.target.value)) } : { tele_fee: Math.min(50_000_000, digits(e.target.value)) })} />
                </span>
              </Field>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Field label="Languages"><ChipToggleGroup label="Languages" options={options?.languages ?? []} selected={f.languages} onChange={(languages) => languages.length > 0 && set({ languages })} /></Field>
          <span className="flex items-center gap-3 text-13 font-bold">Accepts BPJS referrals <Toggle label="Accepts BPJS referrals" checked={f.accepts_bpjs} onChange={(accepts_bpjs) => set({ accepts_bpjs })} /></span>
        </div>
      </ModalSection>

      <ModalSection label="Role in Srikandi Promil">
        <ChipToggleGroup label="Roles" options={ROLE_CHIPS} selected={f.roles} onChange={(roles) => set({ roles })} />
      </ModalSection>
    </Modal>
  )
}
