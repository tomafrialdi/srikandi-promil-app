import { Card, CardHeader, ToggleRow } from '../../../../shared/ui'
import type { Toggle } from '../../types'

interface ToggleCardProps {
  title: string
  items: Toggle[]
  canEdit: boolean
  value: (key: string) => boolean
  onChange: (key: string, on: boolean) => void
}

export function ToggleCard({ title, items, canEdit, value, onChange }: ToggleCardProps) {
  return (
    <Card className="gap-4">
      <CardHeader title={title} />
      <div className="flex flex-col gap-3.5">
        {items.map((t) => (
          <ToggleRow key={t.key} label={t.title} title={t.title} description={t.detail} checked={value(t.key)} disabled={!canEdit} onChange={(on) => onChange(t.key, on)} />
        ))}
      </div>
    </Card>
  )
}
