import { Check } from '@phosphor-icons/react'
import { cn } from '../../../../shared/lib/cn'
import { ChipToggleGroup, Field, ModalSection, SelectField, TextAreaField, TextField } from '../../../../shared/ui'
import { STATUS_ICON_CHOICES } from '../../config/palette'
import { StatusIcon } from '../../components/StatusIcon'
import { CATEGORIES, COLORS, MODES } from '../../engine/fields'
import type { ColorKey, EngineConfig, ModeKey } from '../../types'
import { slugify, type StatusForm } from './status-form'

interface StepProps {
  form: StatusForm
  update: (patch: Partial<StatusForm>) => void
  config: EngineConfig
}

const PALETTE: ColorKey[] = ['primary', 'pink', 'blue', 'green', 'amber', 'purple', 'gray']

export function BasicsStep({ form, update, config }: StepProps) {
  const others = config.statuses.filter((s) => s.key !== form.key).sort((a, b) => a.order - b.order)
  const placement = others
    .filter((_, i) => i === 0 || true)
    .map((next, i) => {
      const prev = others[i - 1]
      return { value: String(next.order), label: `#${i + 1} — ${prev ? `after ${prev.name}, ` : ''}before ${next.name}` }
    })
  const tone = COLORS[form.color]
  const sameKey = !form.editing && config.statuses.some((s) => s.key === form.key)

  return (
    <>
      <ModalSection label="Identity">
        <div className="grid gap-3.5 min-[701px]:grid-cols-2">
          <Field label="Status name" htmlFor="status-name" required>
            <TextField id="status-name" label="" hideLabel value={form.name} maxLength={40} onChange={(e) => update({ name: e.target.value, ...(form.keyTouched ? {} : { key: slugify(e.target.value) }) })} />
          </Field>
          <Field label="Rule key" htmlFor="status-key" required hint="snake_case · unique" error={sameKey ? 'That key is already used' : null}>
            <TextField id="status-key" label="" hideLabel className="font-mono" disabled={form.editing} value={form.key} onChange={(e) => update({ key: slugify(e.target.value), keyTouched: true })} />
          </Field>
        </div>
        <Field label="Description (internal)" htmlFor="status-desc">
          <TextAreaField id="status-desc" maxLength={400} value={form.description} onChange={(e) => update({ description: e.target.value })} />
        </Field>
      </ModalSection>

      <ModalSection label="Appearance">
        <div className="grid gap-4 min-[701px]:grid-cols-2">
          <Field label="Color" required>
            <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Color">
              {PALETTE.map((c) => (
                <button key={c} type="button" role="radio" aria-checked={form.color === c} aria-label={COLORS[c].label} className={cn('inline-flex size-8 items-center justify-center rounded-full text-white', form.color === c && 'outline-2 outline-offset-2 outline-ink')} style={{ background: COLORS[c].hex }} onClick={() => update({ color: c })}>
                  {form.color === c && <Check size={14} weight="bold" />}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Icon" required>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Icon">
              {STATUS_ICON_CHOICES.map((name) => {
                const on = form.icon === name
                return (
                  <button key={name} type="button" role="radio" aria-checked={on} aria-label={name} className="inline-flex size-9 items-center justify-center rounded-lg border" style={on ? { borderColor: tone.hex, background: tone.soft, color: tone.hex } : { borderColor: 'var(--border)', color: 'var(--ink-muted)' }} onClick={() => update({ icon: name })}>
                    <StatusIcon name={name} size={16} />
                  </button>
                )
              })}
            </div>
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-surface px-3.5 py-3">
          <span className="text-11 font-semibold text-ink-faint">Preview</span>
          <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-12 font-bold" style={{ background: tone.soft, color: tone.hex }}>
            <StatusIcon name={form.icon} size={13} /> {form.name || 'New status'}
          </span>
          <span className="flex gap-1" aria-hidden="true">
            {config.statuses.slice(0, 6).map((s) => (
              <span key={s.key} className="h-4 w-4 rounded-[3px]" style={{ background: COLORS[s.color].hex, opacity: 0.55 }} />
            ))}
          </span>
        </div>
      </ModalSection>

      <ModalSection label="Placement">
        <div className="grid gap-3.5 min-[701px]:grid-cols-[minmax(0,1fr)_minmax(0,0.6fr)]">
          <Field label="Evaluation order" hint="first match wins">
            <SelectField aria-label="Evaluation order" value={String(form.order)} options={placement} onChange={(v) => update({ order: Number(v) })} />
          </Field>
          <Field label="Category">
            <SelectField aria-label="Category" value={form.category} options={CATEGORIES} onChange={(v) => update({ category: v as StatusForm['category'] })} />
          </Field>
        </div>
        <Field label="Applies to modes">
          <ChipToggleGroup label="Modes" selected={form.modes} options={MODES.map((m) => ({ value: m.key, label: m.key === 'iui_ivf' ? 'IUI / IVF (uses trigger instead)' : m.label }))} onChange={(next) => update({ modes: next as ModeKey[] })} />
        </Field>
      </ModalSection>
    </>
  )
}
