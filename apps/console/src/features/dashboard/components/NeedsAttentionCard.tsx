import { CaretRight, FileText } from '@phosphor-icons/react'
import { Badge, Card, CardHeader, IconTile } from '../../../shared/ui'
import { ATTENTION_ICON, ATTENTION_TONE } from '../config/labels'
import type { AttentionItem } from '../types'
import styles from './NeedsAttentionCard.module.css'

export function NeedsAttentionCard({ data }: { data: AttentionItem[] }) {
  return (
    <Card className={styles.card}>
      <CardHeader
        title="Needs attention"
        action={data.length > 0 ? <Badge tone="error">{`${data.length} open`}</Badge> : undefined}
      />
      <ul className={styles.list}>
        {data.map((item) => {
          const ItemIcon = ATTENTION_ICON[item.icon] ?? FileText
          const tone = ATTENTION_TONE[item.severity]
          return (
            <li key={item.id} className={styles.item}>
              <IconTile background={tone.background} size={36}>
                <ItemIcon size={17} color={tone.color} />
              </IconTile>
              <div className={styles.text}>
                <span className={styles.title}>{item.title}</span>
                <span className={styles.detail}>{item.detail}</span>
              </div>
              <CaretRight size={16} color="var(--ink-faint)" />
            </li>
          )
        })}
        {data.length === 0 && <li className={styles.empty}>Nothing needs attention right now.</li>}
      </ul>
    </Card>
  )
}
