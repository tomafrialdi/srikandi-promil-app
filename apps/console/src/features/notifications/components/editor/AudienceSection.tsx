import { Plus, ShieldCheck, Users, X } from '@phosphor-icons/react'
import { MultiSelectField, SelectField } from '../../../../shared/ui'
import { formatNumber } from '../../../../shared/lib/format'
import { FIELD_LABEL, FIELD_OP, MODE_OPTIONS, PHASE_OPTIONS, PLAN_OPTIONS } from '../../config/editor'
import type { AudienceRule, CampaignForm, RuleField } from '../../types'
import { StepCard } from './StepCard'

const FIELDS = Object.keys(FIELD_LABEL) as RuleField[]
const BOX = 'h-[31px] rounded-lg bg-surface text-12'
const DAY_CHOICES = [1, 3, 7, 14, 30, 60, 90]

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
      <div className="flex flex-col gap-2">
        {form.rules.map((rule, index) => {
          const days = Number(rule.value) || 30
          return (
            <div key={rule.field} className="flex flex-wrap items-center gap-2.5">
              <span className="w-11 flex-none text-12 font-bold text-ink-faint">{index === 0 ? 'Where' : 'and'}</span>
              <SelectField
                className="w-40"
                triggerClassName={BOX}
                aria-label="Field"
                disabled={disabled}
                value={rule.field}
                options={[rule.field, ...unused].map((f) => ({ value: f, label: FIELD_LABEL[f] }))}
                onChange={(f) => update(index, defaultRule(f as RuleField))}
              />
              <span className="inline-flex h-[31px] w-[110px] items-center rounded-lg border border-border bg-surface px-3 text-12 font-semibold">{rule.op}</span>
              <div className="min-w-48 flex-1">
                {rule.field === 'cycle_phase' && (
                  <SelectField triggerClassName={BOX} aria-label="Cycle phase" disabled={disabled} value={String(rule.value)} options={PHASE_OPTIONS.map((p) => ({ value: p, label: p }))} onChange={(v) => update(index, { ...rule, value: v })} />
                )}
                {rule.field === 'tracking_mode' && (
                  <MultiSelectField triggerClassName={BOX} aria-label="Tracking mode" placeholder="Any mode" disabled={disabled} value={Array.isArray(rule.value) ? rule.value : []} options={MODE_OPTIONS} onChange={(v) => update(index, { ...rule, value: v })} />
                )}
                {rule.field === 'plan' && <SelectField triggerClassName={BOX} aria-label="Plan" disabled={disabled} value={String(rule.value)} options={PLAN_OPTIONS} onChange={(v) => update(index, { ...rule, value: v })} />}
                {rule.field === 'last_active' && (
                  <SelectField
                    triggerClassName={BOX}
                    aria-label="Days"
                    disabled={disabled}
                    value={String(days)}
                    options={[...new Set([...DAY_CHOICES, days])].sort((a, b) => a - b).map((d) => ({ value: String(d), label: `${d} day${d === 1 ? '' : 's'}` }))}
                    onChange={(v) => update(index, { ...rule, value: Number(v) })}
                  />
                )}
              </div>
              {!disabled ? (
                <button type="button" aria-label="Remove condition" className="inline-flex size-8 flex-none items-center justify-center text-ink-faint hover:text-error" onClick={() => set('rules', form.rules.filter((_, i) => i !== index))}>
                  <X size={15} />
                </button>
              ) : (
                <span className="size-8 flex-none" />
              )}
            </div>
          )
        })}
        {form.rules.length === 0 && <p className="text-13 text-ink-muted">No conditions: this reaches every eligible user.</p>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" className="inline-flex items-center gap-1.5 text-13 font-bold text-primary disabled:opacity-45" disabled={disabled || unused.length === 0} onClick={() => set('rules', [...form.rules, defaultRule(unused[0]!)])}>
          <Plus size={14} weight="bold" /> Add condition
        </button>
        <span className="inline-flex items-center gap-1.5 text-13 font-bold text-secondary">
          <Users size={15} weight="fill" />
          Estimated reach: {reach != null ? `${formatNumber(reach)} users${form.delivery === 'trigger' ? '/day' : ''}` : '…'}
        </span>
      </div>
      <p className="flex items-start gap-2 rounded-[10px] bg-surface px-3.5 py-2.5 text-12 leading-snug font-semibold text-ink-muted">
        <ShieldCheck size={14} className="mt-px flex-none" />
        Auto-excluded: users in “After loss” mode, reminders paused, or pregnancy mode. The estimate counts tracking mode, plan and last active; cycle phase is applied when sending.
      </p>
    </StepCard>
  )
}
