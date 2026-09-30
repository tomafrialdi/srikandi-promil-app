import { Lightning, PencilSimple, Plus, Trash } from '@phosphor-icons/react'
import { useState } from 'react'
import { Button, ConfirmDialog, Field, Modal, ModalFooter, ModalSection, TextAreaField, TextField, useToast } from '../../../shared/ui'
import { deleteMacro, saveMacro } from '../services/support.service'
import type { Macro } from '../types'

interface MacrosModalProps {
  open: boolean
  onClose: () => void
  macros: Macro[]
  canEdit: boolean
  onChanged: () => void
}

export function MacrosModal({ open, onClose, macros, canEdit, onChanged }: MacrosModalProps) {
  const toast = useToast()
  const [editing, setEditing] = useState<{ id: string | null; title: string; shortcut: string; body: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Macro | null>(null)

  const save = async () => {
    if (!editing) return
    setSaving(true)
    setError(null)
    try {
      await saveMacro(editing.id, editing.title, editing.shortcut, editing.body)
      toast({ title: 'Macro saved', description: editing.shortcut })
      setEditing(null)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the macro.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <Modal open={open} onClose={onClose} size="md" icon={<Lightning size={20} />} title="Macros" subtitle="Saved replies. Type the shortcut (for example /refund) in a reply to insert one; {name} becomes the customer's first name."
        footer={<ModalFooter info={`${macros.length} macro${macros.length === 1 ? '' : 's'}`}><Button onClick={onClose}>Done</Button></ModalFooter>}>
        {canEdit && !editing && (
          <button type="button" className="inline-flex items-center gap-1 self-start text-12 font-bold text-primary" onClick={() => setEditing({ id: null, title: '', shortcut: '/', body: '' })}><Plus size={12} weight="bold" /> New macro</button>
        )}
        {editing && (
          <ModalSection label={editing.id ? 'Edit macro' : 'New macro'}>
            <div className="grid gap-3 min-[701px]:grid-cols-[minmax(0,1fr)_170px]">
              <Field label="Title" htmlFor="mc-title"><TextField id="mc-title" label="" hideLabel maxLength={60} value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></Field>
              <Field label="Shortcut" htmlFor="mc-short"><TextField id="mc-short" label="" hideLabel className="font-mono" maxLength={25} value={editing.shortcut} onChange={(e) => setEditing({ ...editing, shortcut: e.target.value.toLowerCase().replace(/[^a-z0-9/-]/g, '') })} /></Field>
            </div>
            <Field label="Reply text" htmlFor="mc-body" hint="use {name}"><TextAreaField id="mc-body" maxLength={2000} value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} /></Field>
            {error && <p className="m-0 text-12 font-semibold text-error">{error}</p>}
            <div className="flex justify-end gap-2.5"><Button variant="outline" onClick={() => { setEditing(null); setError(null) }} disabled={saving}>Cancel</Button><Button onClick={save} disabled={saving || editing.title.trim().length < 2 || editing.body.trim().length < 2}>{saving ? 'Saving…' : 'Save macro'}</Button></div>
          </ModalSection>
        )}
        <ul className="m-0 flex list-none flex-col p-0">
          {macros.map((m) => (
            <li key={m.id} className="flex items-start gap-3 border-b border-border py-3 last:border-b-0">
              <code className="mt-0.5 w-24 flex-none text-12 font-bold text-primary">{m.shortcut}</code>
              <span className="flex min-w-0 flex-1 flex-col gap-0.5"><span className="text-13 font-bold">{m.title}</span><span className="line-clamp-2 text-12 text-ink-muted">{m.body}</span><span className="text-11 text-ink-faint">Used {m.uses} times</span></span>
              {canEdit && (
                <span className="flex flex-none gap-1">
                  <button type="button" aria-label={`Edit ${m.shortcut}`} className="inline-flex size-8 items-center justify-center text-ink-muted hover:text-ink" onClick={() => setEditing({ id: m.id, title: m.title, shortcut: m.shortcut, body: m.body })}><PencilSimple size={15} /></button>
                  <button type="button" aria-label={`Delete ${m.shortcut}`} className="inline-flex size-8 items-center justify-center text-ink-muted hover:text-error" onClick={() => setDeleting(m)}><Trash size={15} /></button>
                </span>
              )}
            </li>
          ))}
        </ul>
      </Modal>
      <ConfirmDialog open={deleting !== null} onClose={() => setDeleting(null)} tone="danger" title={`Delete ${deleting?.shortcut}?`} description="Agents can no longer insert this macro. Sent replies are not affected." confirmLabel="Delete macro"
        onConfirm={async () => { if (!deleting) return; await deleteMacro(deleting.id); toast({ title: 'Macro deleted' }); onChanged() }} />
    </>
  )
}
