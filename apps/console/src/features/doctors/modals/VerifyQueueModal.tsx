import { ShieldCheck } from '@phosphor-icons/react'
import { useState } from 'react'
import { Button, Modal, ModalFooter, PageState, TextField, useToast } from '../../../shared/ui'
import { useVerifyQueue } from '../hooks/useDoctorsData'
import { verifyDoctor } from '../services/doctors.service'

export function VerifyQueueModal({ open, onClose, onChanged }: { open: boolean; onClose: () => void; onChanged: () => void }) {
  const toast = useToast()
  const queue = useVerifyQueue(open)
  const [note, setNote] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<string | null>(null)

  const decide = async (id: string, approve: boolean, name: string) => {
    setBusy(id)
    try {
      await verifyDoctor(id, approve, note[id])
      toast({ title: approve ? 'STR verified' : 'STR rejected', description: name })
      queue.reload()
      onChanged()
    } catch (err) {
      toast({ tone: 'error', title: 'Could not update', description: err instanceof Error ? err.message : undefined })
    } finally {
      setBusy(null)
    }
  }

  const items = queue.data ?? []
  return (
    <Modal open={open} onClose={onClose} size="md" icon={<ShieldCheck size={20} />} title="Verify STR (KKI)" subtitle="Check each STR number on the KKI public register, then confirm here." footer={<ModalFooter info="Decisions are logged on the doctor's profile"><Button onClick={onClose}>Done</Button></ModalFooter>}>
      {queue.error && !queue.data ? <PageState title="Could not load the queue" description={queue.error} /> : items.length === 0 && !queue.loading ? (
        <p className="m-0 py-6 text-center text-13 text-ink-muted">Nothing is waiting for verification.</p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {items.map((d) => (
            <li key={d.id} className="flex flex-col gap-2.5 rounded-xl border border-border p-3.5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <span className="flex flex-col"><span className="text-13 font-bold">{d.name}</span><span className="text-12 text-ink-muted">{d.specialty}{d.clinic ? ` · ${d.clinic}` : ''}</span></span>
                <span className="flex flex-col items-end font-mono text-12"><b>STR {d.str_number ?? '—'}</b><span className="text-ink-muted">SIP {d.sip_number ?? '—'}</span></span>
              </div>
              <TextField id={`vq-${d.id}`} label="" hideLabel placeholder="Note (required to reject)" maxLength={200} value={note[d.id] ?? ''} onChange={(e) => setNote({ ...note, [d.id]: e.target.value })} />
              <div className="flex justify-end gap-2.5">
                <Button variant="danger" disabled={busy === d.id} onClick={() => decide(d.id, false, d.name)}>Reject</Button>
                <Button disabled={busy === d.id || !d.str_number} onClick={() => decide(d.id, true, d.name)}>Verified on KKI register</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}
