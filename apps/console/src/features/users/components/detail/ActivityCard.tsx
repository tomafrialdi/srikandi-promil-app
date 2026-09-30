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

export function ActivityCard({ data }: { data: UserDetail['activity'] }) {
  return (
    <Card>
      <CardHeader
        title="Activity log"
        subtitle="Admin & system events"
        action={
          <Link to="/audit-log" className="text-12 font-bold text-primary disabled:text-ink-muted disabled:opacity-45">
            View audit log →
          </Link>
        }
      />
      <ul className="m-0 flex list-none flex-col p-0">
        {data
          .filter((event) => event.text)
          .map((event) => (
            <li key={`${event.at}-${event.text}`} className="flex w-full items-center gap-3 border-b border-border py-3 text-left last:border-b-0">
              <span className="size-2 flex-none rounded-full bg-primary" />
              <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className="flex flex-wrap items-center gap-2 text-13 font-bold">{event.text}</span>
                <span className="text-11 text-ink-faint">{when(event.at)}</span>
              </span>
            </li>
          ))}
      </ul>
    </Card>
  )
}
