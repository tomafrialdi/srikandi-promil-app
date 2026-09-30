import { useCallback, useState } from 'react'
import { useAsyncData } from '../../../shared/hooks/useAsyncData'
import { Button, Modal, ModalFooter, TextAreaField, useToast } from '../../../shared/ui'
import { fetchGuidelines, saveGuidelines } from '../services/community.service'

const updatedFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' })

export function GuidelinesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const toast = useToast()
  const fetcher = useCallback(() => (open ? fetchGuidelines() : Promise.resolve(null)), [open])
  const data = useAsyncData(`community-guidelines-${open}`, fetcher)
  const [draft, setDraft] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const text = draft ?? data.data?.text ?? ''

  const close = () => {
    setDraft(null)
    onClose()
  }

  const save = async () => {
    setBusy(true)
    try {
      await saveGuidelines(text)
      toast({ title: 'Guidelines saved' })
      close()
    } catch (err) {
      toast({ tone: 'error', title: 'Could not save', description: err instanceof Error ? err.message : undefined })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Community guidelines"
      subtitle={data.data?.updated_at ? `Last updated ${updatedFormat.format(new Date(data.data.updated_at))}` : 'Shown to members when they join a group.'}
      size="md"
      footer={
        <ModalFooter info="Only Admins can edit. Changes are logged.">
          <Button variant="outline" onClick={close} disabled={busy}>Cancel</Button>
          <Button onClick={save} disabled={busy || data.loading}>{busy ? 'Saving…' : 'Save guidelines'}</Button>
        </ModalFooter>
      }
    >
      <TextAreaField className="min-h-72" aria-label="Guidelines" value={text} onChange={(e) => setDraft(e.target.value)} disabled={data.loading} />
    </Modal>
  )
}
