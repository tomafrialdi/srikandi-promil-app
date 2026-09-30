import { ArrowRight } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Avatar, Badge, Card, CardHeader } from '../../../shared/ui'
import { timeAgo } from '../../../shared/lib/format'
import { ROLE_TONE } from '../config/labels'
import type { RolesOverview } from '../types'

export function TeamMembersCard({ data }: { data?: RolesOverview }) {
  return (
    <Card className="gap-2 min-[1201px]:w-105 min-[1201px]:flex-none">
      <CardHeader
        title="Team members"
        subtitle={data ? `${data.total_members} active · 2FA enforced` : '…'}
        action={
          <Link to="/roles/members" className="inline-flex items-center gap-1 text-12 font-bold text-primary hover:underline">
            View all <ArrowRight size={12} weight="bold" />
          </Link>
        }
      />
      <ul className="m-0 flex list-none flex-col p-0">
        {(data?.team ?? []).map((m) => (
          <li key={m.id} className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0">
            <Avatar label={m.name.replace(/^dr\.\s*/i, '').charAt(0).toUpperCase()} size={36} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-13 font-bold">{m.name}</span>
              <span className={m.online ? 'text-11 font-semibold text-success' : 'text-11 text-ink-muted'}>
                {m.online ? 'Online' : m.last_seen ? timeAgo(m.last_seen) : 'Never signed in'}
              </span>
            </div>
            <Badge tone={ROLE_TONE[m.role] ?? 'neutral'}>{m.role_label}</Badge>
          </li>
        ))}
      </ul>
    </Card>
  )
}
