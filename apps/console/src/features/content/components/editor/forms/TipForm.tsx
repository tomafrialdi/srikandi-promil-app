import { useCallback } from 'react'
import { useAsyncData } from '../../../../../shared/hooks/useAsyncData'
import { Badge, Field, SelectField, TextAreaField, TextField } from '../../../../../shared/ui'
import { formatCompact } from '../../../../../shared/lib/format'
import { PRIORITY_OPTIONS, ROTATION_OPTIONS, TAP_ACTIONS, TIP_ICONS } from '../../../config/editor'
import { STATUS_BADGE } from '../../../config/labels'
import { fetchTipPool } from '../../../services/content.service'
import type { ContentForm } from '../../../types'
import { cn } from '../../../../../shared/lib/cn'
import { ChipToggleGroup, EditorCard, PhonePreview } from '../fields'

interface TipFormProps {
  form: ContentForm
  id: string | null
  set: <K extends keyof ContentForm>(key: K, value: ContentForm[K]) => void
}

const options = (values: string[]) => values.map((v) => ({ value: v, label: v }))

export function TipForm({ form, id, set }: TipFormProps) {
  const poolFetcher = useCallback(() => fetchTipPool(form.category, id), [form.category, id])
  const pool = useAsyncData(`tip-pool-${form.category}-${id}`, poolFetcher)
  const days = Array.from({ length: 28 }, (_, i) => i + 1)
  const toggleDay = (day: number) => set('cycle_days', form.cycle_days.includes(day) ? form.cycle_days.filter((d) => d !== day) : [...form.cycle_days, day].sort((a, b) => a - b))
  const range = form.cycle_days.length > 0 ? `CD ${form.cycle_days[0]} – ${form.cycle_days[form.cycle_days.length - 1]}` : 'Every cycle day'

  return (
    <>
      <EditorCard className="gap-4">
        <div className="flex flex-col gap-5 min-[900px]:flex-row">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <TextField id="tip-headline" label="Tip headline" maxLength={80} placeholder="Log BBT before you get out of bed" value={form.title} onChange={(e) => set('title', e.target.value)} />
            <Field label="Tip text" hint={`${form.body.length}/240`}>
              <TextAreaField maxLength={240} placeholder="One or two short sentences." value={form.body} onChange={(e) => set('body', e.target.value)} />
            </Field>
            <Field label="Icon">
              <ChipToggleGroup single label="Icon" options={TIP_ICONS} selected={[form.tip_icon]} onChange={([v]) => set('tip_icon', v ?? 'thermometer')} />
            </Field>
            <div className="grid gap-4 min-[600px]:grid-cols-2">
              <Field label="Tap action" htmlFor="tap-action">
                <SelectField id="tap-action" value={form.tap_action} options={options(TAP_ACTIONS)} onChange={(v) => set('tap_action', v)} />
              </Field>
              <TextField id="tip-link" label="Deep link" placeholder="srikandi://log/bbt" value={form.deep_link} onChange={(e) => set('deep_link', e.target.value)} />
            </div>
            <TextField id="tip-source" label="Source / reference" placeholder="ASRM Committee Opinion, 2023" value={form.source_ref} onChange={(e) => set('source_ref', e.target.value)} />
          </div>
          <PhonePreview caption="Preview · Home">
            <div className="flex flex-col gap-1 rounded-xl bg-card p-3 text-11">
              <span className="font-bold text-secondary">Tip of the day</span>
              <span className="font-bold text-ink">{form.title || 'Your tip headline'}</span>
              <span className="leading-snug text-ink-muted">{form.body || 'Your tip text appears here.'}</span>
            </div>
          </PhonePreview>
        </div>
      </EditorCard>

      <EditorCard title="Show on cycle days" badge={<Badge tone="primary">{range}</Badge>}>
        <div className="grid grid-cols-7 gap-1.5 min-[700px]:grid-cols-14" role="group" aria-label="Cycle days">
          {days.map((day) => {
            const active = form.cycle_days.includes(day)
            return (
              <button
                key={day}
                type="button"
                aria-pressed={active}
                className={cn('h-8 rounded-lg border text-12 font-bold', active ? 'border-primary bg-primary-soft text-primary' : 'border-border bg-card text-ink-muted')}
                onClick={() => toggleDay(day)}
              >
                {day}
              </button>
            )
          })}
        </div>
        <div className="grid gap-4 min-[600px]:grid-cols-2">
          <Field label="Rotation" htmlFor="rotation">
            <SelectField id="rotation" value={form.rotation} options={options(ROTATION_OPTIONS)} onChange={(v) => set('rotation', v)} />
          </Field>
          <Field label="Priority" htmlFor="tip-priority">
            <SelectField id="tip-priority" value={form.priority} options={options(PRIORITY_OPTIONS.slice(0, 1).concat(['High', 'Low']))} onChange={(v) => set('priority', v)} />
          </Field>
        </div>
      </EditorCard>

      <EditorCard title={`Tip pool · ${form.category}`} badge={<span className="text-12 font-semibold text-ink-muted">{pool.data ? `${pool.data.length} tips` : ''}</span>}>
        {pool.data && pool.data.length === 0 && <p className="text-13 text-ink-muted">No other tips in this category yet.</p>}
        {(pool.data ?? []).map((tip) => (
          <div key={tip.id} className="flex items-center gap-3 border-b border-border py-2 last:border-b-0">
            <span className="min-w-0 flex-1 truncate text-13 font-semibold">{tip.title}</span>
            <span className="text-12 text-ink-muted">{tip.views_30d > 0 ? `${formatCompact(tip.views_30d)} views` : '—'}</span>
            <Badge tone={STATUS_BADGE[tip.status].tone}>{STATUS_BADGE[tip.status].label}</Badge>
          </div>
        ))}
      </EditorCard>
    </>
  )
}
