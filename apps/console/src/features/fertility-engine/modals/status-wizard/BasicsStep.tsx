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

const SELECT = 'h-10 rounded-[10px]'

export function BasicsStep({ form, update, config }: StepProps) {
  const others = config.statuses.filter((s) => s.key !== form.key).sort((a, b) => a.order - b.order)
  const placement = others.map((next, i) => {
    const prev = others[i - 1]
    return { value: String(next.order), label: `#${i + 1} — ${prev ? `after ${prev.name}, ` : ''}before ${next.name}` }
  })
  const tone = COLORS[form.color]
  const sameKey = !form.editing && config.statuses.some((s) => s.key === form.key)

  // Where the new status lands: just before the status whose order it was given.
  const at = Math.max(0, others.findIndex((o) => o.order === form.order))
  const before = others[at - 1]
  const after = others[at]
  const strip = [...others.slice(Math.max(0, at - 3), at), null, ...others.slice(at, at + 3)]

  return (
    <>
      <ModalSection label="Identity">
        <div className="grid gap-3.5 min-[701px]:grid-cols-[minmax(0,1fr)_260px]">
          <Field label="Status name" htmlFor="status-name" required>
            <TextField compact id="status-name" label="" hideLabel value={form.name} maxLength={40} onChange={(e) => update({ name: e.target.value, ...(form.keyTouched ? {} : { key: slugify(e.target.value) }) })} />
          </Field>
          <Field label="Rule key" htmlFor="status-key" required hint="snake_case · unique" error={sameKey ? 'That key is already used' : null}>
            <TextField compact id="status-key" label="" hideLabel disabled={form.editing} value={form.key} onChange={(e) => update({ key: slugify(e.target.value), keyTouched: true })} />
          </Field>
        </div>
        <Field label="Description (internal)" htmlFor="status-desc">
          <TextAreaField id="status-desc" className="min-h-16 rounded-[10px] text-13 font-semibold" maxLength={400} value={form.description} onChange={(e) => update({ description: e.target.value })} />
        </Field>
      </ModalSection>

      <ModalSection label="Appearance">
        <div className="grid gap-4 min-[701px]:grid-cols-2">
          <Field label="Color" required>
            <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Color">
              {PALETTE.map((c) => (
                <button key={c} type="button" role="radio" aria-checked={form.color === c} aria-label={COLORS[c].label} className={cn('inline-flex size-8 items-center justify-center rounded-full text-white', form.color === c && 'outline-2 outline-offset-1 outline-ink')} style={{ background: COLORS[c].hex }} onClick={() => update({ color: c })}>
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
                  <button key={name} type="button" role="radio" aria-checked={on} aria-label={name} className="inline-flex size-8 items-center justify-center rounded-lg border bg-surface" style={on ? { borderColor: tone.hex, background: tone.soft, color: tone.hex } : { borderColor: 'var(--border)', color: 'var(--ink-muted)' }} onClick={() => update({ icon: name })}>
                    <StatusIcon name={name} size={15} />
                  </button>
                )
              })}
            </div>
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-3.5 rounded-xl bg-surface px-4 py-3.5">
          <span className="text-11 font-bold text-ink-faint">Preview</span>
          <span className="inline-flex h-[27px] items-center gap-1.5 rounded-full px-3 text-12 font-bold" style={{ background: tone.soft, color: tone.hex }}>
            <StatusIcon name={form.icon} size={14} /> {form.name || 'New status'}
          </span>
          <span className="flex gap-1" aria-hidden="true">
            {strip.map((s, i) => (
              <span key={s?.key ?? 'new'} className="h-[18px] w-[22px] rounded" style={{ background: s ? COLORS[s.color].hex : tone.hex }} title={s?.name ?? form.name} data-i={i} />
            ))}
          </span>
          <span className="text-11 font-medium text-ink-muted">
            {before && after ? `appears between ${before.name} and ${after.name}` : after ? `appears first, before ${after.name}` : before ? `appears last, after ${before.name}` : 'first status'}
          </span>
        </div>
      </ModalSection>

      <ModalSection label="Placement">
        <div className="grid gap-3.5 min-[701px]:grid-cols-[minmax(0,1fr)_220px]">
          <Field label="Evaluation order" hint="first match wins">
            <SelectField triggerClassName={SELECT} aria-label="Evaluation order" value={String(form.order)} options={placement} onChange={(v) => update({ order: Number(v) })} />
          </Field>
          <Field label="Category">
            <SelectField triggerClassName={SELECT} aria-label="Category" value={form.category} options={CATEGORIES} onChange={(v) => update({ category: v as StatusForm['category'] })} />
          </Field>
        </div>
        <Field label="Applies to modes">
          <ChipToggleGroup label="Modes" selected={form.modes} options={MODES.map((m) => ({ value: m.key, label: m.key === 'iui_ivf' ? 'IUI / IVF (uses trigger instead)' : m.label }))} onChange={(next) => update({ modes: next as ModeKey[] })} />
        </Field>
      </ModalSection>
    </>
  )
}
