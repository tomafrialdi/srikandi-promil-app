import { Warning } from '@phosphor-icons/react'
import { useState } from 'react'
import { Button, Modal, ModalFooter, Notice, useToast } from '../../../shared/ui'
import { generateBackupCodes } from '../services/account.service'

interface BackupCodesModalProps {
  open: boolean
  left: number
  total: number
  onClose: () => void
  onChanged: () => void
}

export function BackupCodesModal({ open, left, total, onClose, onChanged }: BackupCodesModalProps) {
  const toast = useToast()
  const [codes, setCodes] = useState<string[] | null>(null)
  const [busy, setBusy] = useState(false)

  const close = () => {
    setCodes(null)
    onClose()
  }

  const generate = async () => {
    setBusy(true)
    try {
      setCodes(await generateBackupCodes())
      onChanged()
    } catch (err) {
      toast({ tone: 'error', title: 'Could not generate codes', description: err instanceof Error ? err.message : undefined })
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    await navigator.clipboard.writeText((codes ?? []).join('\n'))
    toast({ title: 'Codes copied' })
  }

  const download = () => {
    const blob = new Blob([`Srikandi Promil admin backup codes\n\n${(codes ?? []).join('\n')}\n`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'srikandi-backup-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Two-factor backup codes"
      subtitle="Use one code if you lose access to your authenticator app. Each code works once."
      size="sm"
      footer={
        <ModalFooter>
          {codes ? (
            <Button onClick={close}>I've saved them</Button>
          ) : (
            <>
              <Button variant="outline" onClick={close}>Close</Button>
              <Button onClick={generate} disabled={busy}>{busy ? 'Generating…' : total > 0 ? 'Regenerate codes' : 'Generate codes'}</Button>
            </>
          )}
        </ModalFooter>
      }
    >
      {codes ? (
        <>
          <ol className="grid grid-cols-2 gap-2">
            {codes.map((code, i) => (
              <li key={code} className="flex items-center gap-2.5 rounded-lg bg-surface px-3 py-2">
                <span className="w-5 text-11 font-bold text-ink-faint">{String(i + 1).padStart(2, '0')}</span>
                <span className="font-mono text-13 font-bold">{code}</span>
              </li>
            ))}
          </ol>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void copy()}>Copy all</Button>
            <Button variant="outline" onClick={download}>Download .txt</Button>
          </div>
          <Notice tone="warning" icon={<Warning size={16} />}>These codes are shown only once. Store them somewhere safe. Old codes no longer work.</Notice>
        </>
      ) : (
        <>
          <div className="rounded-xl bg-surface p-4">
            <p className="text-14 font-bold">{total > 0 ? `${left} of ${total} codes left` : 'No backup codes yet'}</p>
            <p className="mt-1 text-12 text-ink-muted">Codes are stored hashed, so they cannot be shown again. Generate a new set to see them.</p>
          </div>
          <Notice tone="warning" icon={<Warning size={16} />}>
            Regenerating invalidates all current codes immediately. Signing in with a backup code is not enabled yet, so keep your authenticator app available.
          </Notice>
        </>
      )}
    </Modal>
  )
}
