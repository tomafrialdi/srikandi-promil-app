import { Bell, CalendarX, ChatsCircle, Checks, DownloadSimple, GitBranch, Pencil, Pill, SignIn, SealCheck, ShieldWarning, Star, UserPlus, Video, Prohibit, Check, Dot, SignOut, type Icon } from '@phosphor-icons/react'
import { useState } from 'react'
import { cn } from '../../../../shared/lib/cn'
import { Button, PageState } from '../../../../shared/ui'
import { downloadCsv } from '../../../../shared/lib/csv'
import { ACTIVITY_FILTERS } from '../../config/labels'
import { useDoctorActivity } from '../../hooks/useDoctorsData'
import type { ActivityItem, DoctorFull } from '../../types'

const ICONS: Record<string, Icon> = {
  checks: Checks, video: Video, 'sign-in': SignIn, branch: GitBranch, pencil: Pencil, star: Star, pill: Pill, 'calendar-x': CalendarX,
  'shield-warning': ShieldWarning, 'user-plus': UserPlus, 'seal-check': SealCheck, 'seal-warning': ShieldWarning, prohibit: Prohibit, check: Check, 'sign-out': SignOut, bell: Bell, chats: ChatsCircle, dot: Dot,
}
const TONE = { success: 'bg-success-soft text-success', info: 'bg-secondary-soft text-secondary', warning: 'bg-warning-soft text-warning-ink', error: 'bg-error-soft text-error', neutral: 'bg-surface-alt text-ink-muted' }

const dayKey = (iso: string) => new Date(iso).toDateString()
const dayLabel = (iso: string) => {
  const d = new Date(iso)
  const today = new Date()
  const diff = Math.round((new Date(today.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86_400_000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).toUpperCase()
}
const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })

export function ActivityTab({ doctor }: { doctor: DoctorFull }) {
  const [category, setCategory] = useState('')
  const activity = useDoctorActivity(doctor.id, category)
  const items = activity.data ?? []
  const groups: Array<{ label: string; rows: ActivityItem[] }> = []
  for (const it of items) {
    const label = dayLabel(it.at)
    const last = groups[groups.length - 1]
    if (last && dayKey(last.rows[0]!.at) === dayKey(it.at)) last.rows.push(it)
    else groups.push({ label, rows: [it] })
  }
  const s = doctor.stats

  return (
    <>
      <div className="grid grid-cols-2 gap-3 min-[701px]:grid-cols-4">
        {[
          ['Teleconsults (30d)', String(s.teleconsults_30d ?? 0), s.teleconsult_delta_pct != null ? `↑ ${s.teleconsult_delta_pct}%` : ''],
          ['Articles reviewed', String(s.articles_reviewed ?? 0), s.turnaround_h ? `avg ${s.turnaround_h}h turnaround` : ''],
          ['Engine sign-offs', String(s.engine_signoffs ?? 0), ''],
          ['Patient rating', `${Number(doctor.rating).toFixed(1)} ★`, `from ${doctor.reviews} reviews`],
        ].map(([label, value, sub]) => (
          <div key={label} className="flex flex-col gap-0.5 rounded-xl bg-surface px-3.5 py-3"><span className="text-11 text-ink-muted">{label}</span><span className="text-18 font-extrabold">{value}</span><span className="text-11 text-ink-faint">{sub || ' '}</span></div>
        ))}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter activity">
          {ACTIVITY_FILTERS.map((f) => (
            <button key={f.key} type="button" aria-pressed={category === f.key} className={cn('rounded-full border px-3 py-1.5 text-12 font-semibold', category === f.key ? 'border-ink bg-ink text-white' : 'border-border bg-card text-ink-muted')} onClick={() => setCategory(f.key)}>{f.label}</button>
          ))}
        </div>
        <Button variant="outline" disabled={items.length === 0} onClick={() => downloadCsv(`doctor-activity-${doctor.full_name.toLowerCase().replace(/\s+/g, '-')}.csv`, ['Time', 'Category', 'Event', 'Detail'], items.map((i) => [i.at, i.category, i.title, i.detail]))} leadingIcon={<DownloadSimple size={15} />}>Export log</Button>
      </div>
      {activity.error && !activity.data ? <PageState title="Could not load activity" description={activity.error} /> : items.length === 0 && !activity.loading ? <p className="m-0 py-6 text-center text-13 text-ink-muted">No activity yet.</p> : (
        <div className="flex flex-col gap-4">
          {groups.map((g) => (
            <section key={g.label + g.rows[0]!.id} className="flex flex-col gap-3">
              <h3 className="text-11 font-bold tracking-[0.02em] text-ink-faint uppercase">{g.label}</h3>
              {g.rows.map((r) => {
                const Glyph = ICONS[r.icon] ?? Dot
                return (
                  <div key={r.id} className="grid grid-cols-[36px_minmax(0,1fr)_auto] items-start gap-3">
                    <span className={cn('inline-flex size-9 items-center justify-center rounded-full', TONE[r.tone])}><Glyph size={16} /></span>
                    <span className="flex min-w-0 flex-col"><span className="text-13 font-bold">{r.title}</span>{r.detail && <span className="text-12 text-ink-muted">{r.detail}</span>}</span>
                    <span className="text-11 text-ink-faint">{time.format(new Date(r.at))}</span>
                  </div>
                )
              })}
            </section>
          ))}
        </div>
      )}
    </>
  )
}
