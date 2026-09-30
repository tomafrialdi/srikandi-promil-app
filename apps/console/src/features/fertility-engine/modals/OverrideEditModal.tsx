import { PencilSimple, Warning } from '@phosphor-icons/react'
import { useState } from 'react'
import { Button, Field, Modal, ModalFooter, ModalSection, Notice, SelectField, TextField, useToast } from '../../../shared/ui'
import { groupsText } from '../engine/rules'
import { patchDraft } from '../services/engine.service'
import type { Groups, ModeKey, StatusDef, StatusOverride } from '../types'
import { GroupsEditor } from './status-wizard/GroupsEditor'
import { groupsIssues } from './status-wizard/status-form'

interface OverrideEditModalProps {
  open: boolean
  onClose: () => void
  mode: ModeKey
  modeLabel: string
  override: StatusOverride
  status: StatusDef | undefined
  draft: string
  onSaved: () => void
}

const KINDS = [
  { value: 'same', label: 'Same rule as default' },
  { value: 'rule', label: 'Different rule' },
  { value: 'rename', label: 'Rename the status' },
  { value: 'hidden', label: 'Hide in this mode' },
]

/** Mount with a key per override: the form starts from the row that was clicked. */
export function OverrideEditModal({ open, onClose, mode, modeLabel, override, status, draft, onSaved }: OverrideEditModalProps) {
  const toast = useToast()
  const extra = override.kind === 'extra'
  const [kind, setKind] = useState(override.kind)
  const [entry, setEntry] = useState<Groups>(override.entry ?? status?.entry ?? [])
  const [rename, setRename] = useState(override.rename ?? '')
  const [copy, setCopy] = useState(override.copy ?? '')
  const [rule, setRule] = useState(override.rule ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const needsEntry = kind === 'rule' || extra
  const issue = needsEntry ? (entry.length === 0 ? 'Add at least one condition' : groupsIssues(entry) > 0 ? 'Fix the highlighted conditions' : null) : kind === 'rename' && rename.trim().length < 2 ? 'Enter the new name' : null

  const save = async () => {
    setSaving(true)
    setError(null)
    const next: StatusOverride = { status: override.status, kind, ...(override.name ? { name: override.name } : {}), ...(override.color ? { color: override.color } : {}) }
    if (copy.trim()) next.copy = copy.trim()
    if (needsEntry) {
      next.entry = entry
      next.rule = groupsText(entry)
    } else if (kind === 'rename') {
      next.rename = rename.trim()
      next.rule = `renamed → ${rename.trim()}`
    } else if (kind === 'hidden') {
      next.rule = rule.trim() || 'hidden in this mode'
    }
    try {
      await patchDraft([{ op: 'save_override', mode, override: next }], `${modeLabel}: updated “${override.name ?? status?.name ?? override.status}” rule`, mode)
      toast({ title: 'Override saved', description: `Saved to ${draft}.` })
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the override.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      size="md"
      icon={<PencilSimple size={20} />}
      title={`${override.name ?? status?.name ?? override.status} · ${modeLabel}`}
      subtitle={`Override for this mode only · saved to draft ${draft}`}
      footer={
        <ModalFooter info="Goes live only after medical sign-off">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || issue !== null} title={issue ?? undefined}>{saving ? 'Saving…' : 'Save to draft'}</Button>
        </ModalFooter>
      }
    >
      {error && <Notice tone="error" icon={<Warning size={16} />}>{error}</Notice>}
      {!extra && (
        <Field label="In this mode">
          <SelectField aria-label="Override kind" value={kind} options={KINDS} onChange={(v) => setKind(v as StatusOverride['kind'])} />
        </Field>
      )}
      {status && !extra && <p className="m-0 font-mono text-11 text-ink-muted">Default: {status.default ? 'default' : groupsText(status.entry)}</p>}
      {needsEntry && (
        <ModalSection label="Entry conditions">
          <GroupsEditor groups={entry} onChange={setEntry} label="entry" />
        </ModalSection>
      )}
      {kind === 'rename' && (
        <Field label="New name" htmlFor="ov-rename">
          <TextField id="ov-rename" label="" hideLabel maxLength={40} value={rename} onChange={(e) => setRename(e.target.value)} />
        </Field>
      )}
      {kind === 'hidden' && (
        <Field label="Note" htmlFor="ov-rule">
          <TextField id="ov-rule" label="" hideLabel maxLength={80} placeholder="e.g. hidden during program" value={rule} onChange={(e) => setRule(e.target.value)} />
        </Field>
      )}
      <Field label="App copy" htmlFor="ov-copy" hint="what the user sees in this mode">
        <TextField id="ov-copy" label="" hideLabel maxLength={140} placeholder="“Peak fertility today”" value={copy} onChange={(e) => setCopy(e.target.value)} />
      </Field>
    </Modal>
  )
}
