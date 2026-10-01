import { Avatar, Badge, Card } from '../../../../shared/ui'
import { initials } from '../../../../shared/lib/format'
import { MODE_LABEL, PLAN_LABEL } from '../../../../shared/lib/labels'
import { ikUrl } from '../../../../shared/services/imagekit.service'
import type { UserDetail } from '../../types'

export function ProfileCard({ profile }: { profile: UserDetail['profile'] }) {
  const location = [profile.city, profile.province].filter(Boolean).join(', ')
  const contact = [profile.email, profile.phone, location, profile.age != null ? `${profile.age} y.o.` : null].filter(Boolean).join(' · ')

  return (
    <Card className="flex-row flex-wrap items-center gap-5">
      <Avatar label={initials(profile.name)} size={72} src={ikUrl(profile.avatar_url, { w: 160, h: 160 })} />
      <div className="flex min-w-65 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-22 font-extrabold">{profile.name}</h2>
          {profile.status === 'suspended' ? (
            <Badge tone="error">Suspended</Badge>
          ) : profile.deletion_requested ? (
            <Badge tone="warning">Deletion requested</Badge>
          ) : (
            <Badge tone="success"><span className="mr-1.5 inline-block size-1.5 rounded-full bg-success" />Active</Badge>
          )}
          <Badge tone="primary">{PLAN_LABEL[profile.plan].replace(' ', ' · ')}</Badge>
          <Badge tone="info">{MODE_LABEL[profile.mode]} mode</Badge>
        </div>
        <p className="text-13 font-medium text-ink-muted">{contact}</p>
        {profile.suspended_reason && <p className="text-13 text-ink-muted">Suspended: {profile.suspended_reason}</p>}
      </div>
      <div className="flex flex-wrap gap-7">
        <Quick label="Trying for" value={profile.trying_months != null ? `${profile.trying_months} months` : '—'} />
        <Quick label="Cycles tracked" value={String(profile.cycles_tracked)} />
        <Quick label="Streak" value={`${profile.streak_days} days`} />
        <Quick label="Partner" value={profile.partner ? 'Linked' : profile.partner_added ? `Added · ${profile.partner_added}` : 'Not linked'} />
      </div>
    </Card>
  )
}

function Quick({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-12 font-semibold text-ink-muted">{label}</span>
      <span className="text-17 font-extrabold">{value}</span>
    </div>
  )
}
