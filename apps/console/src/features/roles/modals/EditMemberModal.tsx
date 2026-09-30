import { ArrowCounterClockwise, ProhibitInset, Trash, UserGear, Warning } from '@phosphor-icons/react'
import { useState } from 'react'
import { Button, Field, Modal, ModalFooter, ModalSection, Notice, SelectField, TextField, useToast } from '../../../shared/ui'
import type { RoleCatalog } from '../../users/types'
import { updateMember } from '../services/roles.service'
import type { MemberEdit, MemberRow } from '../types'

interface EditMemberModalProps {
  member: MemberRow | null
  catalog?: RoleCatalog
  onClose: () => void
  onSaved: () => void
  onToggleActive: (member: MemberRow) => void
  onRemove: (member: MemberRow) => void
}

/** Mount with a `key` per member: the form starts from the row that was clicked. */
export function EditMemberModal({ member, catalog, onClose, onSaved, onToggleActive, onRemove }: EditMemberModalProps) {
  const toast = useToast()
  const [form, setForm] = useState<MemberEdit>(() => ({
    full_name: member?.name ?? '',
    job_title: member?.job_title ?? '',
    department: member?.department ?? '',
    role: member?.role ?? '',
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const roles = catalog?.roles ?? []
  const role = roles.find((r) => r.role === form.role)
  const canGrantSuper = catalog?.my_role === 'super_admin'
  const departments = [...new Set([...(catalog?.departments ?? []), ...(member?.department ? [member.department] : [])])]
  const roleChanged = member !== null && form.role !== member.role
  const dirty =
    member !== null &&
    (form.full_name.trim() !== member.name || form.job_title.trim() !== (member.job_title ?? '') || form.department !== (member.department ?? '') || roleChanged)
  const set = (patch: Partial<MemberEdit>) => setForm((current) => ({ ...current, ...patch }))

  const save = async () => {
    if (!member) return
    setSaving(true)
    setError(null)
    try {
      await updateMember(member.id, { ...form, full_name: form.full_name.trim(), job_title: form.job_title.trim() })
      toast({ title: 'Member updated', description: roleChanged ? `${form.full_name.trim()} is now ${role?.label}.` : undefined })
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
      open={member !== null}
      onClose={() => !saving && onClose()}
      size="md"
      icon={<UserGear size={20} />}
      title="Edit team member"
      subtitle={member?.email}
      footer={
        <ModalFooter info="Changes are recorded in the audit log">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || !dirty || form.full_name.trim().length < 2}>{saving ? 'Saving…' : 'Save changes'}</Button>
        </ModalFooter>
      }
    >
      {error && <Notice tone="error" icon={<Warning size={16} />}>{error}</Notice>}

      <ModalSection label="Profile">
        <div className="grid gap-3.5 min-[701px]:grid-cols-2">
          <TextField id="member-name" label="Full name" value={form.full_name} onChange={(e) => set({ full_name: e.target.value })} maxLength={80} />
          <TextField id="member-title" label="Job title" placeholder="e.g. Support agent · Midwife" value={form.job_title} onChange={(e) => set({ job_title: e.target.value })} maxLength={80} />
          <Field label="Department">
            <SelectField aria-label="Department" value={form.department} options={[{ value: '', label: 'No department' }, ...departments.map((d) => ({ value: d, label: d }))]} onChange={(department) => set({ department })} />
          </Field>
          <Field label="Email">
            <div className="flex h-11 items-center rounded-control border border-border bg-surface px-3.5 text-13 font-semibold text-ink-muted">{member?.email}</div>
          </Field>
        </div>
      </ModalSection>

      <ModalSection label="Role">
        <Field label="Role">
          <SelectField
            aria-label="Role"
            value={form.role}
            options={roles.map((r) => ({ value: r.role, label: r.label + (r.role === 'super_admin' && !canGrantSuper ? ' (Super admin only)' : '') }))}
            onChange={(next) => set({ role: next })}
          />
        </Field>
        {role && <p className="m-0 text-12 text-ink-muted">{role.summary}</p>}
        {roleChanged && (
          <Notice tone="warning" icon={<Warning size={16} />}>
            Changing the role updates what this member can see straight away, and may sign them out of all devices (see Security settings › Sessions).
          </Notice>
        )}
      </ModalSection>

      {member && (
        <ModalSection label="Access">
          <div className="flex flex-wrap gap-2.5">
            <Button variant="outline" onClick={() => onToggleActive(member)} leadingIcon={member.status === 'active' ? <ProhibitInset size={16} /> : <ArrowCounterClockwise size={16} />}>
              {member.status === 'active' ? 'Suspend access' : 'Reactivate'}
            </Button>
            <Button variant="danger" onClick={() => onRemove(member)} leadingIcon={<Trash size={16} />}>Remove member</Button>
          </div>
        </ModalSection>
      )}
    </Modal>
  )
}
