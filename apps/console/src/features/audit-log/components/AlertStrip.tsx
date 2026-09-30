import { Clock, ShieldWarning, UserCircleGear } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { Button } from '../../../shared/ui'
import { timeAgo } from '../../../shared/lib/format'
import { cn } from '../../../shared/lib/cn'
import { DSR_TYPE } from '../config/labels'
import { daysLeft } from '../lib/format'
import type { AlertSummary, AuditSummary } from '../types'

interface AlertStripProps {
  data?: AuditSummary
  onAlert: (id: string) => void
  onDsr: (id: string) => void
}

function AlertCard({ tone, icon, title, time, detail, action, onAction }: { tone: 'error' | 'warning' | 'info'; icon: ReactNode; title: string; time: string; detail: string; action: string; onAction: () => void }) {
  return (
    <div className={cn('flex min-w-0 flex-1 items-start gap-3 rounded-2xl border px-4 py-3.5', tone === 'error' && 'border-error/20 bg-error-soft', tone === 'warning' && 'border-warning/25 bg-warning-soft', tone === 'info' && 'border-secondary/20 bg-secondary-soft')}>
      <span className="mt-0.5 inline-flex flex-none text-ink">{icon}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <h3 className="truncate text-13 font-extrabold">{title}</h3>
          <span className="flex-none text-11 font-semibold text-ink-muted">{time}</span>
        </div>
        <p className="text-12 leading-snug font-medium text-ink-muted">{detail}</p>
        <Button variant="outline" className="mt-1.5 w-fit !px-3 !py-1.5 text-12" onClick={onAction}>{action}</Button>
      </div>
    </div>
  )
}

const alertTone = (a: AlertSummary) => (a.severity === 'high' ? 'error' : a.severity === 'medium' ? 'warning' : 'info')

export function AlertStrip({ data, onAlert, onDsr }: AlertStripProps) {
  if (!data) return null
  const dsr = data.dsr_due
  const left = dsr ? daysLeft(dsr.due_at) : 0
  const alerts = data.alerts.slice(0, dsr ? 2 : 3)
  if (alerts.length === 0 && !dsr) return null
  return (
    <div className="grid gap-4 min-[1101px]:grid-cols-3">
      {alerts.map((a) => (
        <AlertCard key={a.id} tone={alertTone(a)} icon={a.severity === 'high' ? <ShieldWarning size={20} weight="fill" /> : <UserCircleGear size={20} weight="fill" />} title={a.title} time={timeAgo(a.at)} detail={a.detail} action={a.severity === 'high' ? 'Investigate' : 'Review'} onAction={() => onAlert(a.id)} />
      ))}
      {dsr && (
        <AlertCard
          tone="info"
          icon={<Clock size={20} weight="fill" />}
          title={`${DSR_TYPE[dsr.type as keyof typeof DSR_TYPE] ?? 'Request'} request due ${left <= 0 ? 'now' : `in ${left} day${left === 1 ? '' : 's'}`}`}
          time={`DSR-${String(dsr.number).padStart(4, '0')}`}
          detail={`${dsr.subject_ref} · UU PDP · ${left > 0 ? `${left} of 30 days left` : 'deadline passed'}`}
          action="Open request"
          onAction={() => onDsr(dsr.id)}
        />
      )}
    </div>
  )
}
