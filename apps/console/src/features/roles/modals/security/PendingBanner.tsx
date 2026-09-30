import { Hourglass } from '@phosphor-icons/react'
import { useState } from 'react'
import { Button, useToast } from '../../../../shared/ui'
import { changeLabel } from '../../config/security-options'
import { cancelSecurityChange, decideSecurityChange } from '../../services/roles.service'
import type { SecurityData } from '../../types'

interface PendingBannerProps {
  pending: NonNullable<SecurityData['pending']>
  canDecide: boolean
  onDone: () => void
}

/** The open two-person request: its author can cancel it, another Super admin approves or rejects it. */
export function PendingBanner({ pending, canDecide, onDone }: PendingBannerProps) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const shown = pending.changes.slice(0, 4).map(changeLabel).join(', ')
  const more = pending.changes.length > 4 ? ` +${pending.changes.length - 4} more` : ''

  const run = async (task: () => Promise<void>, done: string) => {
    setBusy(true)
    try {
      await task()
      toast({ title: done })
      onDone()
    } catch (err) {
      toast({ tone: 'error', title: 'Could not update the request', description: err instanceof Error ? err.message : undefined })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl bg-warning-soft px-3.5 py-3 text-warning-ink">
      <Hourglass size={18} className="flex-none" />
      <p className="m-0 min-w-0 flex-1 text-12 leading-snug font-semibold">
        {pending.mine ? 'Your change request is' : `${pending.requested_by}’s change request is`} awaiting a second Super admin · {shown}{more}
      </p>
      {pending.mine ? (
        <Button variant="outline" disabled={busy} onClick={() => run(() => cancelSecurityChange(pending.id), 'Request cancelled')}>Cancel request</Button>
      ) : (
        canDecide && (
          <>
            <Button variant="outline" disabled={busy} onClick={() => run(() => decideSecurityChange(pending.id, false), 'Request rejected')}>Reject</Button>
            <Button disabled={busy} onClick={() => run(() => decideSecurityChange(pending.id, true), 'Change approved and applied')}>Approve</Button>
          </>
        )
      )}
    </div>
  )
}
