import { Eye, EyeSlash } from '@phosphor-icons/react'
import { Button, Card, CardHeader } from '../../../../shared/ui'

/** Entry point to the user's daily logs. The logs themselves are health data: opening them asks for a reason. */
export function DailyLogsCard({ onOpen }: { onOpen: () => void }) {
  return (
    <Card className="gap-3.5">
      <CardHeader
        title="Daily logs"
        subtitle="Temperature, mood, symptoms, cervical fluid, LH, intimacy and pregnancy tests"
        action={
          <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-surface-alt px-2.5 text-11 font-bold text-ink-muted">
            <EyeSlash size={13} />
            Masked
          </span>
        }
      />
      <p className="m-0 text-13 font-medium text-ink-muted">
        Entries the user logged in the app. Opening them is recorded with your name and the reason you give.
      </p>
      <div>
        <Button variant="outline" onClick={onOpen} leadingIcon={<Eye size={16} />}>
          View daily logs
        </Button>
      </div>
    </Card>
  )
}
