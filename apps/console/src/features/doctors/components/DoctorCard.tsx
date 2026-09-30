import { MapPin } from '@phosphor-icons/react'
import { Badge } from '../../../shared/ui'
import { cn } from '../../../shared/lib/cn'
import { formatIdrCompact } from '../../../shared/lib/format'
import { STATUS_BADGE } from '../config/labels'
import type { DoctorRow } from '../types'
import { DoctorAvatar } from './DoctorAvatar'

interface DoctorCardProps {
  doctor: DoctorRow
  selected: boolean
  onSelect: () => void
}

export function DoctorCard({ doctor: d, selected, onSelect }: DoctorCardProps) {
  const inactive = d.status === 'suspended' || d.status === 'draft'
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn('flex min-w-0 flex-col gap-3 rounded-card border bg-card p-4 text-left', selected ? 'border-primary shadow-[0_0_0_1px_var(--primary)]' : 'border-border', inactive && 'opacity-70')}
    >
      <span className="flex items-start gap-3">
        <DoctorAvatar name={d.name} url={d.photo_url} size={52} />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="text-14 leading-snug font-bold break-words">{d.name}</span>
          <span className="text-12 leading-snug text-ink-muted">{d.specialty}</span>
        </span>
      </span>
      {d.location && (
        <span className="flex items-center gap-1.5 text-12 text-ink-muted">
          <MapPin size={13} className="flex-none" />
          <span className="min-w-0 truncate">{d.location}</span>
        </span>
      )}
      <span className="flex flex-wrap gap-1.5">
        {d.tele && <Badge tone="info">Teleconsult</Badge>}
        {d.bpjs && <Badge tone="success">BPJS</Badge>}
        {d.status === 'active' || d.status === 'suspended' || d.status === 'draft' ? (
          d.status === 'active' ? (
            d.str_status === 'verified' ? <Badge tone="neutral">Verified</Badge> : <Badge tone="warning">STR pending</Badge>
          ) : (
            <Badge tone={STATUS_BADGE[d.status].tone}>{STATUS_BADGE[d.status].label}</Badge>
          )
        ) : (
          <Badge tone="warning">STR pending</Badge>
        )}
      </span>
      <span className="mt-auto flex items-center justify-between border-t border-border pt-3 text-12">
        <span className="font-bold text-warning-ink">★ {Number(d.rating).toFixed(1)}</span>
        <span className="font-bold">{d.price != null ? `${formatIdrCompact(d.price)} / consult` : '—'}</span>
      </span>
    </button>
  )
}
