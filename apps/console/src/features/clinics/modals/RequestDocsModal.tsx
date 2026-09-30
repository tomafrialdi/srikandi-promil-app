import { Envelope } from '@phosphor-icons/react'
import { useState } from 'react'
import { Button, CheckRow, Modal, ModalFooter, TextAreaField, useToast } from '../../../shared/ui'
import { DOCS, DOC_ORDER } from '../config/labels'
import { requestDocs } from '../services/clinics.service'
import type { ClinicFull } from '../types'

const KINDS = [...DOC_ORDER, 'str_sip'] as const

/** Mount with a key per clinic: pre-selects the documents that are missing. */
export function RequestDocsModal({ open, onClose, clinic, onDone }: { open: boolean; onClose: () => void; clinic: ClinicFull; onDone: () => void }) {
  const toast = useToast()
  const missing = new Set<string>(clinic.documents.filter((d) => d.status === 'missing' || d.status === 'rejected').map((d) => d.kind))
  const [picked, setPicked] = useState<string[]>(() => KINDS.filter((k) => missing.has(k) && (clinic.type === 'fertility' || (k !== 'kfer_cert' && k !== 'art_licence'))))
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const send = async () => {
    setBusy(true)
    try {
      await requestDocs(clinic.id, picked, message)
      toast({ title: 'Documents requested', description: `${clinic.admin_email ?? 'The clinic admin'} will be asked to upload them.` })
      onDone()
      onClose()
    } catch (err) {
      toast({ tone: 'error', title: 'Could not send the request', description: err instanceof Error ? err.message : undefined })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={() => !busy && onClose()} size="sm" icon={<Envelope size={20} />} title="Request documents" subtitle={clinic.name} footer={<ModalFooter info={clinic.admin_email ? `To ${clinic.admin_email}` : 'No clinic admin email yet'}><Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button><Button onClick={send} disabled={busy || picked.length === 0}>{busy ? 'Sending…' : 'Send request'}</Button></ModalFooter>}>
      <div className="flex flex-col gap-3">
        {KINDS.map((k) => (
          <CheckRow key={k} checked={picked.includes(k)} onChange={(on) => setPicked(on ? [...picked, k] : picked.filter((x) => x !== k))} title={DOCS[k].label} description={missing.has(k) ? 'Missing' : undefined} />
        ))}
      </div>
      <TextAreaField placeholder="Message to the clinic (optional)" maxLength={300} value={message} onChange={(e) => setMessage(e.target.value)} />
    </Modal>
  )
}
