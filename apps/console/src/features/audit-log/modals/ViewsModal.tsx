import { BookmarkSimple, Trash, Warning } from '@phosphor-icons/react'
import { useState } from 'react'
import { Badge, Button, Field, Modal, ModalFooter, ModalSection, Notice, PageState, TextField, ToggleRow, useToast } from '../../../shared/ui'
import { categoryLabel, RANGES } from '../config/labels'
import { useViews } from '../hooks/useAuditData'
import { deleteView, saveView } from '../services/audit.service'
import type { ViewFilters } from '../types'

interface ViewsModalProps {
  open: boolean
  onClose: () => void
  current: ViewFilters
  onApply: (filters: ViewFilters) => void
}

const describe = (f: ViewFilters) =>
  [f.category ? categoryLabel(f.category) : 'All categories', f.risk ? `${f.risk} risk` : null, f.search ? `“${f.search}”` : null, RANGES.find((r) => r.value === (f.range ?? '24h'))?.label].filter(Boolean).join(' · ')

/** Mount with a key per opening so the name field starts empty. */
export function ViewsModal({ open, onClose, current, onApply }: ViewsModalProps) {
  const toast = useToast()
  const { data: views, error, reload } = useViews()
  const [name, setName] = useState('')
  const [shared, setShared] = useState(false)
  const [busy, setBusy] = useState(false)
  const [fail, setFail] = useState<string | null>(null)

  const act = async (work: () => Promise<void>) => {
    setBusy(true)
    setFail(null)
    try {
      await work()
    } catch (err) {
      setFail(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} size="sm" icon={<BookmarkSimple size={20} />} title="Saved views" subtitle="Reusable filter sets for the event table" footer={<ModalFooter info="Shared views are visible to every admin"><Button variant="outline" onClick={onClose}>Done</Button></ModalFooter>}>
      {fail && <Notice tone="error" icon={<Warning size={16} />}>{fail}</Notice>}
      <ModalSection label="Your views">
        {!views ? (
          <PageState title={error ?? 'Loading…'} />
        ) : views.length === 0 ? (
          <p className="text-13 text-ink-muted">No saved views yet. Save the current filters below.</p>
        ) : (
          <ul className="m-0 flex list-none flex-col rounded-xl border border-border p-0">
            {views.map((v) => (
              <li key={v.id} className="flex items-center gap-2 border-b border-border px-3.5 py-2.5 last:border-b-0">
                <button type="button" className="flex min-w-0 flex-1 flex-col text-left" onClick={() => { onApply(v.filters); onClose() }}>
                  <span className="flex items-center gap-2 text-13 font-bold">{v.name}{v.shared && <Badge tone="info">{v.mine ? 'Shared' : `by ${v.owner ?? 'admin'}`}</Badge>}</span>
                  <span className="truncate text-11 text-ink-muted">{describe(v.filters)}</span>
                </button>
                {v.mine && <button type="button" aria-label={`Delete ${v.name}`} className="text-ink-faint hover:text-error disabled:opacity-50" disabled={busy} onClick={() => act(async () => { await deleteView(v.id); reload() })}><Trash size={15} /></button>}
              </li>
            ))}
          </ul>
        )}
      </ModalSection>
      <ModalSection label="Save current filters">
        <p className="text-12 font-medium text-ink-muted">{describe(current)}</p>
        <Field label="Name" htmlFor="view-name"><TextField id="view-name" label="" hideLabel maxLength={50} placeholder="e.g. Weekly DPO review" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <ToggleRow label="Share with all admins" title="Share with all admins" checked={shared} onChange={setShared} />
        <Button disabled={busy || name.trim().length < 2} onClick={() => act(async () => { await saveView(name.trim(), current, shared); toast({ title: 'View saved', description: name.trim() }); setName(''); reload() })}>Save view</Button>
      </ModalSection>
    </Modal>
  )
}
