import { Badge, Card, CardHeader } from '../../../../shared/ui'
import { COLORS } from '../../engine/fields'
import { WEIGHT_KEYS, fmtWeight, weightSum } from '../../lib'
import type { ModeKey, Weights } from '../../types'
import { WeightRow } from '../WeightRow'

interface ModeWeightsProps {
  mode: ModeKey
  color: keyof typeof COLORS
  weights: Weights
  baseline: Weights
  canEdit: boolean
  onChange: (key: keyof Weights, value: number) => void
}

export function ModeWeights({ mode, color, weights, baseline, canEdit, onChange }: ModeWeightsProps) {
  const keys = WEIGHT_KEYS[mode]
  const changed = keys.filter((k) => Math.abs(weights[k] - baseline[k]) > 0.004).length
  const sum = weightSum(weights)
  const valid = Math.abs(sum - 1) < 0.005
  const chip = !valid ? { tone: 'error' as const, text: `Σ ${fmtWeight(sum)} — must be 1.00` } : mode === 'ttc' ? null : mode === 'iui_ivf' ? { tone: 'info' as const, text: 'Protocol overrides' } : changed === 0 ? { tone: 'neutral' as const, text: 'Same as TTC' } : { tone: 'warning' as const, text: `${changed} changed` }

  return (
    <Card className="gap-4">
      <CardHeader title="Signal weights" subtitle={mode === 'ttc' ? 'Baseline · must sum to 1.00' : 'vs. default TTC · must sum to 1.00'} action={chip ? <Badge tone={chip.tone}>{chip.text}</Badge> : mode === 'ttc' ? <Badge tone="neutral">Baseline</Badge> : undefined} />
      <div className="flex flex-col gap-2.5">
        {keys.map((k) => (
          <WeightRow key={k} signal={k} value={weights[k]} color={COLORS[color].strong} disabled={!canEdit} baseline={baseline[k]} offAtZero={mode === 'iui_ivf'} onChange={(v) => onChange(k, v)} />
        ))}
      </div>
      <div className="flex gap-4 text-11 font-semibold text-ink-muted">
        <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-3 rounded-full" style={{ background: COLORS[color].strong }} />This mode</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-0.5 rounded-full bg-ink" />TTC default</span>
      </div>
    </Card>
  )
}
