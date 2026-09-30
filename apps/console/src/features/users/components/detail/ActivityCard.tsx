import { Bell, Crown, ShieldCheck, SignIn, TestTube, Pulse, type Icon } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Card, CardHeader } from '../../../../shared/ui'
import type { UserDetail } from '../../types'

const dayTime = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
const timeOnly = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' })

function when(iso: string): string {
  const date = new Date(iso)
  return dayKey.format(date) === dayKey.format(new Date()) ? `Today, ${timeOnly.format(date)}` : dayTime.format(date)
}

/** Icon + tint guessed from the event text (events are free text from the audit trail / feature usage). */
function look(text: string): { icon: Icon; tile: string } {
  const t = text.toLowerCase()
  if (/sign(ed)? in|login/.test(t)) return { icon: SignIn, tile: 'bg-surface-alt text-ink-muted' }
  if (/lh test|scanned/.test(t)) return { icon: TestTube, tile: 'bg-primary-soft text-primary' }
  if (/notification|push|delivered/.test(t)) return { icon: Bell, tile: 'bg-secondary-soft text-secondary' }
  if (/renew|plan|payment|subscription|refund/.test(t)) return { icon: Crown, tile: 'bg-success-soft text-success' }
  if (/admin|viewed|unmask|masked/.test(t)) return { icon: ShieldCheck, tile: 'bg-surface-alt text-ink-muted' }
  return { icon: Pulse, tile: 'bg-surface-alt text-ink-muted' }
}

export function ActivityCard({ data }: { data: UserDetail['activity'] }) {
  return (
    <Card>
      <CardHeader
        title="Activity log"
        subtitle="Admin & system events"
        action={
          <Link to="/audit-log" className="text-13 font-bold text-primary">
            View audit log →
          </Link>
        }
      />
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {data
          .map((event) => ({ ...event, text: event.text ?? '' }))
          .filter((event) => event.text)
          .map((event) => {
            const { icon: Glyph, tile } = look(event.text)
            return (
              <li key={`${event.at}-${event.text}`} className="flex items-center gap-3">
                <span className={`inline-flex size-8 flex-none items-center justify-center rounded-full ${tile}`}><Glyph size={15} /></span>
                <span className="min-w-0 flex-1 truncate text-13 font-semibold">{event.text}</span>
                <span className="flex-none text-12 font-medium text-ink-faint">{when(event.at)}</span>
              </li>
            )
          })}
      </ul>
    </Card>
  )
}
