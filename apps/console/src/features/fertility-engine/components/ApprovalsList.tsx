import { Avatar, Badge } from '../../../shared/ui'
import type { Approval, Decision } from '../types'

const TONE: Record<Decision, { label: string; tone: 'warning' | 'success' | 'error' }> = {
  pending: { label: 'Pending', tone: 'warning' },
  approved: { label: 'Approved', tone: 'success' },
  rejected: { label: 'Rejected', tone: 'error' },
}

export function ApprovalsList({ approvals, author }: { approvals: Approval[]; author?: string | null }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-2 p-0">
      {approvals.map((a) => (
        <li key={a.reviewer_id} className="flex items-center gap-3 rounded-xl bg-surface px-3.5 py-3">
          <Avatar label={a.name.replace(/^dr\.\s*/i, '').charAt(0).toUpperCase()} size={34} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-13 font-bold">{a.name}, {a.credentials}</span>
            <span className="text-11 text-ink-muted">Medical reviewer · required</span>
          </span>
          <Badge tone={TONE[a.decision].tone}>{TONE[a.decision].label}</Badge>
        </li>
      ))}
      {author && (
        <li className="flex items-center gap-3 rounded-xl bg-surface px-3.5 py-3">
          <Avatar label={author.charAt(0).toUpperCase()} size={34} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-13 font-bold">{author}</span>
            <span className="text-11 text-ink-muted">Engine engineer · author</span>
          </span>
          <Badge tone="info">Submitted</Badge>
        </li>
      )}
    </ul>
  )
}
