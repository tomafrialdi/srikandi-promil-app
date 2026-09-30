import { Check, PencilSimple, Warning } from '@phosphor-icons/react'
import { useState } from 'react'
import { cn } from '../../../shared/lib/cn'
import { Button, Modal, ModalFooter, Notice, useToast } from '../../../shared/ui'
import { buildPatch, countChanges, toForm } from '../lib/doctor-form'
import { updateDoctor } from '../services/doctors.service'
import type { DoctorForm, DoctorFull, DoctorsOptions } from '../types'
import { ActivityTab } from './edit/ActivityTab'
import { PermissionsTab } from './edit/PermissionsTab'
import { PracticeTab } from './edit/PracticeTab'
import { PricingTab } from './edit/PricingTab'
import { ProfileTab } from './edit/ProfileTab'

const TABS = [
  { key: 'profile', label: 'Profile' },
  { key: 'practice', label: 'Practice & schedule' },
  { key: 'pricing', label: 'Pricing' },
  { key: 'permissions', label: 'Permissions' },
  { key: 'activity', label: 'Activity' },
] as const
type TabKey = (typeof TABS)[number]['key']

interface EditDoctorModalProps {
  open: boolean
  onClose: () => void
  doctor: DoctorFull
  options?: DoctorsOptions
  onSaved: () => void
  onSuspend: () => void
}

const lastUpdated = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

/** Mount with a key per doctor + updated_at: the form starts from the loaded doctor. */
export function EditDoctorModal({ open, onClose, doctor, options, onSaved, onSuspend }: EditDoctorModalProps) {
  const toast = useToast()
  const [original] = useState<DoctorForm>(() => toForm(doctor))
  const [form, setForm] = useState<DoctorForm>(original)
  const [tab, setTab] = useState<TabKey>('profile')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const changes = countChanges(original, form)

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await updateDoctor(doctor.id, buildPatch(original, form))
      toast({ title: 'Profile saved', description: doctor.name })
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the changes.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      size="lg"
      icon={<PencilSimple size={20} />}
      title={`Edit profile · ${doctor.name}`}
      subtitle={`Last updated ${lastUpdated.format(new Date(doctor.updated_at))}${doctor.updated_by ? ` by ${doctor.updated_by}` : ''} · changes are logged`}
      tabs={
        <nav className="flex gap-6 overflow-x-auto border-b border-border px-6" role="tablist" aria-label="Doctor sections">
          {TABS.map((t) => (
            <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} className={cn('-mb-px border-b-2 border-transparent py-3 text-13 font-semibold whitespace-nowrap text-ink-muted', tab === t.key && 'border-primary font-bold text-primary')} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </nav>
      }
      footer={
        <ModalFooter info={tab === 'activity' ? 'Activity is read-only · retained 5 years' : changes > 0 ? <span className="inline-flex items-center gap-2 font-semibold text-warning-ink"><span className="size-1.5 rounded-full bg-warning" />{changes} unsaved change{changes === 1 ? '' : 's'}</span> : 'No changes yet'}>
          <Button variant="outline" onClick={onClose} disabled={saving}>{tab === 'activity' || changes === 0 ? 'Close' : 'Cancel'}</Button>
          {tab !== 'activity' && <Button onClick={save} disabled={saving || changes === 0} leadingIcon={<Check size={16} color="#fff" />}>{saving ? 'Saving…' : 'Save changes'}</Button>}
        </ModalFooter>
      }
    >
      {error && <Notice tone="error" icon={<Warning size={16} />}>{error}</Notice>}
      {tab === 'profile' && <ProfileTab doctor={doctor} form={form} setForm={setForm} options={options} onSuspend={onSuspend} onReload={onSaved} />}
      {tab === 'practice' && <PracticeTab form={form} setForm={setForm} options={options} />}
      {tab === 'pricing' && <PricingTab doctor={doctor} original={original} form={form} setForm={setForm} />}
      {tab === 'permissions' && <PermissionsTab doctor={doctor} form={form} setForm={setForm} onReload={onSaved} />}
      {tab === 'activity' && <ActivityTab doctor={doctor} />}
    </Modal>
  )
}
