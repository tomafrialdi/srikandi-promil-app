import { Card, CardHeader } from '../../../../shared/ui'
import { formatCompact, formatMinutes } from '../../../../shared/lib/format'
import type { EngagementData } from '../../types'

export function TopContentCard({ data }: { data: EngagementData['top_content'] }) {
  return (
    <Card className="min-w-0 flex-1">
      <CardHeader title="Top content this month" subtitle="Reads · avg. read time" />
      <ol className="m-0 flex list-none flex-col p-0">
        {data.map((article, index) => (
          <li key={article.title} className="flex items-center gap-3 border-b border-border py-[11px] last:border-b-0">
            <span className="w-[18px] text-13 font-extrabold text-ink-faint">{index + 1}</span>
            <span className="min-w-0 flex-1 text-13 font-semibold">{article.title}</span>
            <span className="text-12 font-bold">{formatCompact(article.reads)}</span>
            <span className="w-10 text-right text-12 font-medium text-ink-muted">{formatMinutes(article.avg_seconds)}</span>
          </li>
        ))}
        {data.length === 0 && <li className="text-13 text-ink-muted">No reads in this range.</li>}
      </ol>
    </Card>
  )
}
