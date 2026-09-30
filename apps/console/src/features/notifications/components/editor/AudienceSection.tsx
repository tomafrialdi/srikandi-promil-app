import { Plus, Trash } from '@phosphor-icons/react'
import { ChipToggleGroup, SelectField } from '../../../../shared/ui'
import { formatNumber } from '../../../../shared/lib/format'
import { FIELD_LABEL, FIELD_OP, MODE_OPTIONS, PHASE_OPTIONS, PLAN_OPTIONS } from '../../config/editor'
import type { AudienceRule, CampaignForm, RuleField } from '../../types'
import { StepCard } from './StepCard'

const FIELDS = Object.keys(FIELD_LABEL) as RuleField[]

const defaultRule = (field: RuleField): AudienceRule => ({
  field,
  op: FIELD_OP[field],
  value: field === 'cycle_phase' ? PHASE_OPTIONS[0]! : field === 'tracking_mode' ? [] : field === 'plan' ? 'all' : 30,
})

interface AudienceSectionProps {
  form: CampaignForm
  set: <K extends keyof CampaignForm>(key: K, value: CampaignForm[K]) => void
  reach?: number
  disabled?: boolean
}

export function AudienceSection({ form, set, reach, disabled }: AudienceSectionProps) {
  const unused = FIELDS.filter((f) => !form.rules.some((r) => r.field === f))
  const update = (index: number, rule: AudienceRule) => set('rules', form.rules.map((r, i) => (i === index ? rule : r)))

  return (
    <StepCard n={2} title="Audience">
      <div className="flex flex-col gap-2.5">
        {form.rules.map((rule, index) => (
          <div key={rule.field} className="flex flex-wrap items-center gap-2.5">
            <span className="w-11 flex-none text-12 font-bold text-ink-muted">{index === 0 ? 'Where' : 'and'}</span>
            <SelectField
              variant="pill"
              aria-label="Field"
              disabled={disabled}
              value={rule.field}
              options={[rule.field, ...unused].map((f) => ({ value: f, label: FIELD_LABEL[f] }))}
              onChange={(f) => update(index, defaultRule(f as RuleField))}
            />
            <span className="text-12 font-semibold text-ink-muted">{rule.op}</span>
            {rule.field === 'cycle_phase' && (
              <SelectField variant="pill" aria-label="Cycle phase" disabled={disabled} value={String(rule.value)} options={PHASE_OPTIONS.map((p) => ({ value: p, label: p }))} onChange={(v) => update(index, { ...rule, value: v })} />
            )}
            {rule.field === 'tracking_mode' && (
              <ChipToggleGroup label="Tracking mode" options={MODE_OPTIONS} selected={Array.isArray(rule.value) ? rule.value : []} onChange={(v) => !disabled && update(index, { ...rule, value: v })} />
            )}
            {rule.field === 'plan' && (
              <SelectField variant="pill" aria-label="Plan" disabled={disabled} value={String(rule.value)} options={PLAN_OPTIONS} onChange={(v) => update(index, { ...rule, value: v })} />
            )}
            {rule.field === 'last_active' && (
              <span className="inline-flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={365}
                  aria-label="Days"
                  disabled={disabled}
                  className="h-9 w-16 rounded-lg border border-border bg-card px-2 text-center text-13 font-semibold outline-0 focus-visible:border-primary"
                  value={Number(rule.value) || ''}
                  onChange={(e) => update(index, { ...rule, value: Math.max(1, Number(e.target.value) || 1) })}
                />
                <span className="text-12 font-semibold text-ink-muted">days</span>
              </span>
            )}
            {!disabled && (
              <button type="button" aria-label="Remove condition" className="ml-auto inline-flex size-8 items-center justify-center text-ink-muted" onClick={() => set('rules', form.rules.filter((_, i) => i !== index))}>
                <Trash size={14} />
              </button>
            )}
          </div>
        ))}
        {form.rules.length === 0 && <p className="text-13 text-ink-muted">No conditions: this reaches every eligible user.</p>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3.5">
        <button type="button" className="inline-flex items-center gap-1 text-13 font-bold text-primary disabled:opacity-45" disabled={disabled || unused.length === 0} onClick={() => set('rules', [...form.rules, defaultRule(unused[0]!)])}>
          <Plus size={13} weight="bold" /> Add condition
        </button>
        <span className="text-13 font-bold text-success">Estimated reach: {reach != null ? `${formatNumber(reach)} users` : '…'}</span>
      </div>
      <p className="rounded-xl bg-surface-alt px-3.5 py-2.5 text-12 text-ink-muted">
        Auto-excluded: users in “After loss” mode, reminders paused, or pregnancy mode. The estimate counts tracking mode, plan and last active; cycle phase is applied when sending.
      </p>
    </StepCard>
  )
}
