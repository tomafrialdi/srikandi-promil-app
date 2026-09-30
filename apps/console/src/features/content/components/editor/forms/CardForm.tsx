import { Plus, Trash } from '@phosphor-icons/react'
import { useState } from 'react'
import { Field, ImageUpload, SelectField, TextAreaField, TextField, ToggleRow, DateField } from '../../../../../shared/ui'
import { cn } from '../../../../../shared/lib/cn'
import { CARD_LAYOUTS, CARD_SCREENS, EMPTY_VARIANT, PRIORITY_OPTIONS } from '../../../config/editor'
import type { CardVariant, ContentForm } from '../../../types'
import { ChipToggleGroup, EditorCard, INPUT, PhonePreview } from '../fields'

interface CardFormProps {
  form: ContentForm
  set: <K extends keyof ContentForm>(key: K, value: ContentForm[K]) => void
}

const LETTERS = ['A', 'B', 'C']

export function CardForm({ form, set }: CardFormProps) {
  const [active, setActive] = useState(0)
  const index = Math.min(active, form.variants.length - 1)
  const variant = form.variants[index] ?? EMPTY_VARIANT

  const patch = (change: Partial<CardVariant>) => set('variants', form.variants.map((v, i) => (i === index ? { ...v, ...change } : v)))

  const addVariant = () => {
    if (form.variants.length >= 3) return
    const share = Math.floor(100 / (form.variants.length + 1))
    set('variants', [...form.variants.map((v) => ({ ...v, weight: share })), { ...variant, weight: 100 - share * form.variants.length }])
    setActive(form.variants.length)
  }

  const removeVariant = () => {
    if (form.variants.length <= 1) return
    const rest = form.variants.filter((_, i) => i !== index)
    const share = Math.floor(100 / rest.length)
    set('variants', rest.map((v, i) => ({ ...v, weight: i === 0 ? 100 - share * (rest.length - 1) : share })))
    setActive(0)
  }

  return (
    <>
      <EditorCard title="Card layout">
        <div className="grid grid-cols-2 gap-2.5 min-[700px]:grid-cols-4" role="radiogroup" aria-label="Card layout">
          {CARD_LAYOUTS.map((layout) => (
            <button
              key={layout.value}
              type="button"
              role="radio"
              aria-checked={form.layout === layout.value}
              className={cn('h-14 rounded-xl border text-13 font-bold', form.layout === layout.value ? 'border-primary bg-primary-soft text-primary' : 'border-border bg-card text-ink-muted')}
              onClick={() => set('layout', layout.value as ContentForm['layout'])}
            >
              {layout.label}
            </button>
          ))}
        </div>
      </EditorCard>

      <EditorCard className="gap-4">
        <div className="flex flex-col gap-5 min-[900px]:flex-row">
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Variants">
              {form.variants.map((v, i) => (
                <button
                  key={LETTERS[i]}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  className={cn('h-8 rounded-lg px-3 text-12 font-bold', i === index ? 'bg-primary-soft text-primary' : 'bg-surface-alt text-ink-muted')}
                  onClick={() => setActive(i)}
                >
                  Variant {LETTERS[i]}{form.variants.length > 1 ? ` · ${v.weight}%` : ''}
                </button>
              ))}
              {form.variants.length < 3 && (
                <button type="button" className="inline-flex h-8 items-center gap-1 rounded-lg px-2.5 text-12 font-bold text-primary" onClick={addVariant}>
                  <Plus size={12} weight="bold" /> Add
                </button>
              )}
              {form.variants.length > 1 && (
                <button type="button" aria-label="Remove this variant" className="ml-auto inline-flex size-8 items-center justify-center rounded-lg text-error" onClick={removeVariant}>
                  <Trash size={14} />
                </button>
              )}
            </div>

            <ImageUpload value={form.image_url || null} folder="/cards" label="Add card image" aspectClassName="aspect-[2/1]" onChange={(image) => set('image_url', image?.url ?? '')} />
            <TextField id="card-title" label="Title" maxLength={60} placeholder="Scan your LH strip in seconds" value={variant.title} onChange={(e) => patch({ title: e.target.value })} />
            <Field label="Body" hint={`${variant.body.length}/140`}>
              <TextAreaField maxLength={140} placeholder="Short supporting copy." value={variant.body} onChange={(e) => patch({ body: e.target.value })} />
            </Field>
            <div className="grid gap-4 min-[600px]:grid-cols-2">
              <TextField id="card-cta" label="Button label" maxLength={24} placeholder="Try it now" value={variant.cta_label} onChange={(e) => patch({ cta_label: e.target.value })} />
              <TextField id="card-link" label="Deep link" placeholder="srikandi://scan/lh" value={variant.deep_link} onChange={(e) => patch({ deep_link: e.target.value })} />
            </div>
          </div>
          <PhonePreview caption={`Preview · ${form.screens[0] ?? 'Home'}`}>
            <div className="flex flex-col gap-2 overflow-hidden rounded-xl bg-card text-11">
              {form.image_url ? <img src={form.image_url} alt="" className="aspect-[2/1] w-full object-cover" /> : <div className="aspect-[2/1] w-full bg-primary-soft" />}
              <div className="flex flex-col gap-1 px-3 pb-3">
                <span className="font-bold text-ink">{variant.title || 'Card title'}</span>
                <span className="leading-snug text-ink-muted">{variant.body || 'Card body copy.'}</span>
                {variant.cta_label && <span className="mt-1 self-start rounded-md bg-primary px-2.5 py-1 font-bold text-white">{variant.cta_label}</span>}
              </div>
            </div>
          </PhonePreview>
        </div>
      </EditorCard>

      <EditorCard title="Placement & display rules">
        <Field label="Screens" required>
          <ChipToggleGroup label="Screens" options={CARD_SCREENS} selected={form.screens} onChange={(v) => set('screens', v)} />
        </Field>
        <div className="grid gap-4 min-[700px]:grid-cols-3">
          <Field label="Frequency cap" htmlFor="freq" hint="impressions / user">
            <input id="freq" type="number" min={1} max={20} className={INPUT} value={form.frequency_cap} onChange={(e) => set('frequency_cap', Math.max(1, Number(e.target.value) || 1))} />
          </Field>
          <Field label="Priority" htmlFor="card-priority">
            <SelectField id="card-priority" value={form.priority} options={PRIORITY_OPTIONS.map((v) => ({ value: v, label: v }))} onChange={(v) => set('priority', v)} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Run from" htmlFor="run-from"><DateField id="run-from" value={form.run_from} onChange={(v) => set('run_from', v)} /></Field>
            <Field label="Run to" htmlFor="run-to"><DateField id="run-to" min={form.run_from} value={form.run_to} onChange={(v) => set('run_to', v)} /></Field>
          </div>
        </div>
        <ToggleRow label="Dismissible" title="Dismissible" description="User can close; hidden for 30 days after dismiss" checked={form.dismissible} onChange={(v) => set('dismissible', v)} />
        <ToggleRow label="Hide after conversion" title="Hide after conversion" description="Stop showing once the user has taken the action" checked={form.hide_after_conversion} onChange={(v) => set('hide_after_conversion', v)} />
        <ToggleRow label="Show in discreet mode" title="Show in discreet mode" description="Uses neutral copy “New feature available”" checked={form.discreet_mode} onChange={(v) => set('discreet_mode', v)} />
      </EditorCard>
    </>
  )
}
