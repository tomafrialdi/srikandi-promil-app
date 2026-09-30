import { Calendar, DownloadSimple } from '@phosphor-icons/react'
import { useState } from 'react'
import { Button } from '../../../shared/ui'

function greeting(hour: number): string {
  if (hour < 11) return 'Good morning'
  if (hour < 15) return 'Good afternoon'
  if (hour < 19) return 'Good evening'
  return 'Good night'
}

export function DashboardHeader({ firstName }: { firstName: string }) {
  const [hour] = useState(() => new Date().getHours())
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-26 font-extrabold">
          {greeting(hour)}
          {firstName && `, ${firstName}`}
        </h1>
        <p className="text-14 text-ink-muted">Here's how Srikandi Promil is doing in the last 30 days.</p>
      </div>
      <div className="flex gap-2.5">
        <Button variant="outline" leadingIcon={<Calendar size={16} />}>
          Last 30 days
        </Button>
        <Button leadingIcon={<DownloadSimple size={16} color="#fff" />}>Export report</Button>
      </div>
    </div>
  )
}
