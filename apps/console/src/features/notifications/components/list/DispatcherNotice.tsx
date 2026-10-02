import { CheckCircle, Warning } from '@phosphor-icons/react'
import { Notice } from '../../../../shared/ui'
import { formatNumber } from '../../../../shared/lib/format'
import type { DispatcherStatus } from '../../types'

/** A campaign only reaches users when the dispatcher job runs, so say plainly whether it is running. */
export function DispatcherNotice({ status }: { status?: DispatcherStatus }) {
  if (!status) return null

  if (status.last_run_at === null) {
    return (
      <Notice tone="warning" icon={<Warning size={16} />}>
        The dispatcher has never run, so campaigns are queued but not delivered. Set up the scheduled job once (see <code>supabase/functions/notify-dispatch/README.md</code>).
        {status.queued > 0 && ` ${formatNumber(status.queued)} campaign${status.queued === 1 ? ' is' : 's are'} waiting.`}
      </Notice>
    )
  }

  if ((status.minutes_ago ?? 0) > 15) {
    return (
      <Notice tone="warning" icon={<Warning size={16} />}>
        The dispatcher last ran {status.minutes_ago} minutes ago (it should run every 5). Check the Supabase Cron job for <code>notify-dispatch</code>.
      </Notice>
    )
  }

  return (
    <Notice tone="success" icon={<CheckCircle size={16} />}>
      Dispatcher running · last run {status.minutes_ago === 0 ? 'just now' : `${status.minutes_ago} min ago`} · {formatNumber(status.devices)} device{status.devices === 1 ? '' : 's'} registered for push
      {status.pending_push > 0 && ` · ${formatNumber(status.pending_push)} push waiting`}
    </Notice>
  )
}
