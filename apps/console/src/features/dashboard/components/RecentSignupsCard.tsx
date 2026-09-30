import { Link } from 'react-router-dom'
import { Avatar, Badge, Card, CardHeader } from '../../../shared/ui'
import { initials, timeAgo } from '../../../shared/lib/format'
import { MODE_LABEL, PLAN_BADGE } from '../config/labels'
import type { RecentSignup } from '../types'

const ROW = 'flex min-h-14 items-center border-b border-border last:border-b-0'

export function RecentSignupsCard({ data }: { data: RecentSignup[] }) {
  return (
    <Card className="min-w-0 flex-1 gap-1">
      <CardHeader
        title="Recent sign-ups"
        subtitle="Latest users"
        action={
          <Link to="/users" className="text-13 font-bold text-primary">
            View all users →
          </Link>
        }
      />

      <div className="flex flex-col" role="table">
        <div className={`${ROW} min-h-10 text-11 font-bold text-ink-faint`} role="row">
          <span className="min-w-0 flex-1">USER</span>
          <span className="w-27.5 flex-none">PLAN</span>
          <span className="hidden w-32.5 flex-none min-[901px]:block">MODE</span>
          <span className="hidden w-30 flex-none min-[901px]:block">CITY</span>
          <span className="w-25 flex-none">JOINED</span>
        </div>
        {data.map((user) => {
          const badge = PLAN_BADGE[user.plan]
          return (
            <div key={user.id} className={ROW} role="row">
              <span className="flex min-w-0 flex-1 items-center gap-2.5">
                <Avatar label={initials(user.full_name)[0] ?? ''} />
                <span className="flex min-w-0 flex-col">
                  <span className="text-13 font-bold">{user.full_name}</span>
                  <span className="truncate text-12 text-ink-muted">{user.email}</span>
                </span>
              </span>
              <span className="w-27.5 flex-none">
                <Badge tone={badge.tone}>{badge.label}</Badge>
              </span>
              <span className="hidden w-32.5 flex-none text-13 font-semibold min-[901px]:block">{MODE_LABEL[user.tracking_mode]}</span>
              <span className="hidden w-30 flex-none text-13 text-ink-muted min-[901px]:block">{user.city ?? '—'}</span>
              <span className="w-25 flex-none text-13 text-ink-muted">{timeAgo(user.created_at)}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
