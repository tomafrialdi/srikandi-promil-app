import { CaretRight, FileText } from '@phosphor-icons/react'
import { Badge, Card, CardHeader, IconTile } from '../../../shared/ui'
import { ATTENTION_ICON, ATTENTION_TONE } from '../config/labels'
import type { AttentionItem } from '../types'

export function NeedsAttentionCard({ data }: { data: AttentionItem[] }) {
  return (
    <Card className="w-full flex-none min-[1101px]:w-100">
      <CardHeader title="Needs attention" action={data.length > 0 ? <Badge tone="error">{`${data.length} open`}</Badge> : undefined} />
      <ul className="m-0 flex list-none flex-col p-0">
        {data.map((item) => {
          const ItemIcon = ATTENTION_ICON[item.icon] ?? FileText
          const tone = ATTENTION_TONE[item.severity]
          return (
            <li key={item.id} className="flex items-center gap-3 py-2.5">
              <IconTile background={tone.background} size={36}>
                <ItemIcon size={17} color={tone.color} />
              </IconTile>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-13 font-bold">{item.title}</span>
                <span className="text-12 text-ink-muted">{item.detail}</span>
              </div>
              <CaretRight size={16} color="var(--ink-faint)" />
            </li>
          )
        })}
        {data.length === 0 && <li className="py-4 text-13 text-ink-muted">Nothing needs attention right now.</li>}
      </ul>
    </Card>
  )
}
