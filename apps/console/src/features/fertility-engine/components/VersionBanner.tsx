import { approvalsLine, daysSince, fmtDate } from '../lib'
import type { EngineState } from '../types'

function Dot({ color }: { color: string }) {
  return <span className="size-2 flex-none rounded-full" style={{ background: color }} />
}

export function VersionBanner({ state }: { state?: EngineState }) {
  const live = state?.versions.find((v) => v.status === 'live')
  const canary = state?.versions.find((v) => v.status === 'canary')
  const working = state?.versions.find((v) => v.status === 'draft' || v.status === 'in_review')
  const match = state?.metrics.global?.find((m) => m.key === 'ovulation_match')
  const awaiting = canary && state?.subject?.id === canary.id ? approvalsLine(state.approvals) : null

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl bg-ink px-5 py-4 text-white">
      {live && (
        <div className="flex min-w-0 items-center gap-2.5">
          <Dot color="#5cc46f" />
          <span className="text-13 font-extrabold tracking-wide">LIVE {live.version}</span>
          <span className="text-12 text-white/75">
            {live.rollout_pct}% users · since {fmtDate(live.live_at)}
            {live.signed_off_by ? ` · signed off by ${live.signed_off_by}` : ''}
          </span>
        </div>
      )}
      {canary && (
        <div className="flex min-w-0 items-center gap-2.5 border-white/15 min-[1101px]:border-l min-[1101px]:pl-6">
          <Dot color="#e0a030" />
          <span className="text-13 font-extrabold tracking-wide">CANARY {canary.version}</span>
          <span className="text-12 text-white/75">
            {canary.rollout_pct}% users{canary.summary ? ` · ${canary.summary}` : ''} · day {daysSince(canary.canary_at) + 1} of {state?.canary_window_days ?? 7}
            {awaiting ? ` · ${awaiting.split(' · ').slice(-1)[0]}` : ''}
          </span>
        </div>
      )}
      {working && (
        <div className="flex min-w-0 items-center gap-2.5 border-white/15 min-[1101px]:border-l min-[1101px]:pl-6">
          <Dot color="#8fb4ea" />
          <span className="text-13 font-extrabold tracking-wide">{working.status === 'draft' ? 'DRAFT' : 'IN REVIEW'} {working.version}</span>
          <span className="text-12 text-white/75">{working.status === 'draft' ? 'not submitted' : 'awaiting medical sign-off'}</span>
        </div>
      )}
      {match && (
        <div className="ml-auto flex items-center gap-2 text-12 text-white/75">
          Ovulation match vs BBT confirm: <span className="text-16 font-extrabold text-[#5cc46f]">{match.value}</span>
        </div>
      )}
    </div>
  )
}
