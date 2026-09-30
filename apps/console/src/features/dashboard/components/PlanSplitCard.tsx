import { Card, CardHeader, DonutChart } from '../../../shared/ui'
import { formatNumber, formatPercent } from '../../../shared/lib/format'
import { PLAN_COLOR, PLAN_LABEL } from '../config/labels'
import type { PlanSplit } from '../types'

export function PlanSplitCard({ data }: { data: PlanSplit }) {
  return (
    <Card className="w-full flex-none min-[1101px]:w-95">
      <CardHeader title="Plan split" subtitle="Active accounts by plan" />

      <div className="flex items-center gap-5">
        <DonutChart segments={data.plans.map((p) => ({ value: p.count, color: PLAN_COLOR[p.plan] }))}>
          <span className="text-20 font-extrabold">{formatPercent(data.paid_pct)}</span>
          <span className="text-11 font-semibold text-ink-muted">paid</span>
        </DonutChart>

        <ul className="m-0 flex flex-1 list-none flex-col gap-2.5 p-0">
          {data.plans.map((p) => (
            <li key={p.plan} className="flex items-center gap-2">
              <span className="size-2 rounded-full" style={{ background: PLAN_COLOR[p.plan] }} />
              <span className="flex-1 text-12 font-semibold text-ink-muted">{PLAN_LABEL[p.plan]}</span>
              <span className="text-12 font-bold">{formatNumber(p.count)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between rounded-xl bg-surface px-3.5 py-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-12 font-semibold text-ink-muted">Trial → paid conversion</span>
          <span className="text-20 font-extrabold">{formatPercent(data.trial_conversion_pct)}</span>
        </div>
      </div>
    </Card>
  )
}
