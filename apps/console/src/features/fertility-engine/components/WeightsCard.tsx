import { useState } from 'react'
import { Badge, Button, Card, useToast } from '../../../shared/ui'
import { COLORS } from '../engine/fields'
import { WEIGHT_KEYS, fmtWeight, weightSum } from '../lib'
import { patchDraft } from '../services/engine.service'
import type { Weights } from '../types'
import { WeightRow } from './WeightRow'

interface WeightsCardProps {
  weights: Weights
  canEdit: boolean
  onSaved: () => void
}

/** Default (TTC) signal weights. Edits stay local until "Save to draft". */
export function WeightsCard({ weights, canEdit, onSaved }: WeightsCardProps) {
  const toast = useToast()
  const [draft, setDraft] = useState(weights)
  const [saving, setSaving] = useState(false)
  const sum = weightSum(draft)
  const valid = Math.abs(sum - 1) < 0.005
  const dirty = JSON.stringify(draft) !== JSON.stringify(weights)

  const save = async () => {
    setSaving(true)
    try {
      await patchDraft([{ op: 'set_weights', mode: 'ttc', weights: draft }], 'Default signal weights changed', 'ttc')
      toast({ title: 'Saved to draft' })
      onSaved()
    } catch (err) {
      toast({ tone: 'error', title: 'Could not save the weights', description: err instanceof Error ? err.message : undefined })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="gap-4">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-16 font-bold">Signal weights</h2>
          <p className="text-12 font-medium text-ink-muted">Mode: TTC (default) · must sum to 1.00</p>
        </div>
        <Badge tone={valid ? 'success' : 'error'}>{`Σ ${fmtWeight(sum)}`}</Badge>
      </header>
      <div className="flex flex-col gap-3.5">
        {WEIGHT_KEYS.ttc.map((key) => (
          <WeightRow key={key} signal={key} value={draft[key]} color={COLORS.primary.hex} boxed disabled={!canEdit} onChange={(v) => setDraft((d) => ({ ...d, [key]: v }))} />
        ))}
      </div>
      {canEdit && dirty && (
        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <span className={valid ? 'text-12 text-ink-muted' : 'text-12 font-semibold text-error'}>{valid ? 'Unsaved changes' : 'Weights must sum to 1.00'}</span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setDraft(weights)} disabled={saving}>Reset</Button>
            <Button onClick={save} disabled={saving || !valid}>{saving ? 'Saving…' : 'Save to draft'}</Button>
          </div>
        </div>
      )}
    </Card>
  )
}
