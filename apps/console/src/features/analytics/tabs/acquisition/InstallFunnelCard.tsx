import { Card, CardHeader, ProgressBar } from '../../../../shared/ui'
import { formatNumber, formatPercent, toPercentOf } from '../../../../shared/lib/format'
import type { AcquisitionData } from '../../types'

export function InstallFunnelCard({ data }: { data: AcquisitionData['funnel'] }) {
  const total = data.steps[0]?.count ?? 0
  return (
    <Card className="w-full flex-none min-[1101px]:w-100">
      <CardHeader title="Install → paid funnel" subtitle="Installs in the selected range" />
      {data.steps.map((step, index) => {
        const pct = toPercentOf(step.count, total)
        return (
          <div key={step.key} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-12 font-semibold">
              <span>{step.label}</span>
              <span className="font-bold text-ink-muted">
                {formatNumber(step.count)} · {formatPercent(pct, pct < 10 ? 1 : 0)}
              </span>
            </div>
            <ProgressBar value={pct} color={index < 4 ? 'var(--secondary)' : 'var(--primary)'} />
          </div>
        )
      })}
    </Card>
  )
}
