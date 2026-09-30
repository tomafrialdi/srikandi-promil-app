import { Card, CardHeader } from '../../../../shared/ui'
import { formatCompact, formatMinutes } from '../../../../shared/lib/format'
import type { EngagementData } from '../../types'
import styles from './EngagementTab.module.css'

export function TopContentCard({ data }: { data: EngagementData['top_content'] }) {
  return (
    <Card className={styles.grow}>
      <CardHeader title="Top content" subtitle="Reads · avg. read time" />
      <ol className={styles.list}>
        {data.map((article, index) => (
          <li key={article.title} className={styles.listItem}>
            <span className={styles.rank}>{index + 1}</span>
            <span className={styles.articleTitle}>{article.title}</span>
            <span className={styles.reads}>{formatCompact(article.reads)}</span>
            <span className={styles.readTime}>{formatMinutes(article.avg_seconds)}</span>
          </li>
        ))}
        {data.length === 0 && <li className={styles.empty}>No reads in this range.</li>}
      </ol>
    </Card>
  )
}
