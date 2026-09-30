import { useState } from 'react'
import { Button, Field, Modal, ModalFooter, Segmented, TextAreaField, TextField, ToggleRow, useToast } from '../../../shared/ui'
import { createGroup } from '../services/community.service'

interface NewGroupModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

const EMPTY = { name: '', description: '', visibility: 'public' as 'public' | 'private', hosted_by: '', protected: false, moderators: '' }

export function NewGroupModal({ open, onClose, onCreated }: NewGroupModalProps) {
  const toast = useToast()
  const [form, setForm] = useState(EMPTY)
  const [busy, setBusy] = useState(false)
  const patch = (change: Partial<typeof EMPTY>) => setForm((f) => ({ ...f, ...change }))

  const submit = async () => {
    setBusy(true)
    try {
      await createGroup({
        name: form.name,
        description: form.description,
        visibility: form.visibility,
        hosted_by: form.visibility === 'private' ? form.hosted_by : null,
        protected: form.protected,
        moderators: form.moderators.split(',').map((m) => m.trim()).filter(Boolean),
      })
      toast({ title: 'Group created', description: form.name })
      setForm(EMPTY)
      onCreated()
      onClose()
    } catch (err) {
      toast({ tone: 'error', title: 'Could not create the group', description: err instanceof Error ? err.message : undefined })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={busy ? () => undefined : onClose}
      title="New group"
      subtitle="Groups are where members talk. Add moderators before opening it."
      size="sm"
      footer={
        <ModalFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy || form.name.trim().length < 2}>{busy ? 'Creating…' : 'Create group'}</Button>
        </ModalFooter>
      }
    >
      <TextField id="group-name" label="Group name" maxLength={60} placeholder="e.g. Endometriosis" value={form.name} onChange={(e) => patch({ name: e.target.value })} />
      <Field label="Description">
        <TextAreaField placeholder="What is this group for?" value={form.description} onChange={(e) => patch({ description: e.target.value })} />
      </Field>
      <Field label="Visibility">
        <Segmented label="Visibility" value={form.visibility} options={[{ value: 'public', label: 'Public' }, { value: 'private', label: 'Private (clinic-hosted)' }]} onChange={(v) => patch({ visibility: v })} />
      </Field>
      {form.visibility === 'private' && <TextField id="group-host" label="Hosted by" placeholder="Clinic name" value={form.hosted_by} onChange={(e) => patch({ hosted_by: e.target.value })} />}
      <TextField id="group-mods" label="Moderators" placeholder="Dewi A., Rina M." value={form.moderators} onChange={(e) => patch({ moderators: e.target.value })} />
      <ToggleRow label="Protected group" title="Protected group" description="Sensitive topic: counsellors moderate, posts are reviewed with extra care" checked={form.protected} onChange={(v) => patch({ protected: v })} />
    </Modal>
  )
}
