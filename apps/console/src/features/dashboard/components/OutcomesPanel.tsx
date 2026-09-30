import { Baby } from '@phosphor-icons/react'
import { formatNumber } from '../../../shared/lib/format'
import type { Outcomes } from '../types'

export function OutcomesPanel({ data }: { data: Outcomes }) {
  const change =
    data.conceived_prev_month > 0
      ? Math.round((100 * (data.conceived_this_month - data.conceived_prev_month)) / data.conceived_prev_month)
      : null

  return (
    <section className="flex w-full flex-none flex-col gap-4 rounded-card bg-primary p-5 text-white min-[1101px]:w-85">
      <header className="flex items-center gap-2">
        <Baby size={18} color="#fff" />
        <h2 className="text-15 font-bold">Fertility outcomes</h2>
      </header>

      <Metric label="Pregnancies reported (this month)" value={formatNumber(data.conceived_this_month)} hint={change == null ? 'no data for last month' : `${change >= 0 ? '+' : ''}${change}% vs last month`} />
      <Metric label="Avg. cycles to conceive" value={data.avg_cycles_to_conceive?.toString() ?? '—'} hint="users logging ≥3 signals" />
      <Metric label="Referred to specialist" value={formatNumber(data.referred_to_specialist)} hint="after 12 months trying" />
    </section>
  )
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="flex flex-col gap-0.5 pt-3">
      <span className="text-12 font-semibold text-white/80">{label}</span>
      <span className="text-26 font-extrabold">{value}</span>
      <span className="text-11 text-white/70">{hint}</span>
    </div>
  )
}
