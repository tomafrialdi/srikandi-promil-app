import { formatNumber } from '../../../../shared/lib/format'
import { StatusIcon } from '../../components/StatusIcon'
import { COLORS } from '../../engine/fields'
import { versionChip } from '../../lib'
import type { EngineState, ModeKey } from '../../types'

export function ModeBanner({ state, mode }: { state: EngineState; mode: ModeKey }) {
  const cfg = state.subject!.config.modes[mode]
  const stats: Array<{ value: string; label: string }> = [{ value: formatNumber(state.mode_users[mode]), label: 'Users' }]
  for (const m of state.metrics[`banner:${mode}`] ?? []) stats.push({ value: m.value, label: m.label })
  if (mode === 'iui_ivf') stats.push({ value: `IUI ${formatNumber(state.programs.iui)} · IVF ${formatNumber(state.programs.ivf)}`, label: 'Programs' })

  return (
    <section className="flex flex-wrap items-center gap-x-6 gap-y-4 rounded-2xl px-6 py-5 text-white" style={{ background: COLORS[cfg.meta.color].strong }}>
      <span className="inline-flex size-14 flex-none items-center justify-center rounded-2xl bg-white/20">
        <StatusIcon name={cfg.meta.icon} size={26} />
      </span>
      <div className="flex min-w-60 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="text-22 leading-tight font-extrabold">{cfg.meta.title}</h2>
          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-11 font-bold">{versionChip(state.subject!)}</span>
        </div>
        <p className="m-0 max-w-[62ch] text-13 leading-normal text-white/90">{cfg.meta.description}</p>
      </div>
      <dl className="m-0 flex gap-7">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col">
            <dt className="order-2 text-11 font-medium text-white/80">{s.label}</dt>
            <dd className="order-1 m-0 text-22 leading-tight font-extrabold whitespace-nowrap">{s.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
