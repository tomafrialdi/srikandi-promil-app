import { EyeSlash } from '@phosphor-icons/react'
import { useRef } from 'react'
import { Field, Segmented, SelectField, TextAreaField, TextField } from '../../../../shared/ui'
import { VARIABLES } from '../../config/editor'
import type { CampaignForm } from '../../types'
import { StepCard } from './StepCard'

interface MessageSectionProps {
  form: CampaignForm
  set: <K extends keyof CampaignForm>(key: K, value: CampaignForm[K]) => void
  disabled?: boolean
}

const SELECT = 'h-10 rounded-[10px] bg-surface'

export function MessageSection({ form, set, disabled }: MessageSectionProps) {
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const isPush = form.channel === 'push'

  const insert = (variable: string) => {
    const el = bodyRef.current
    const at = el?.selectionEnd ?? form.body.length
    set('body', `${form.body.slice(0, at)}${variable}${form.body.slice(at)}`)
    requestAnimationFrame(() => {
      el?.focus()
      el?.setSelectionRange(at + variable.length, at + variable.length)
    })
  }

  return (
    <StepCard n={3} title="Message">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-60 flex-1">
          <Field label="Title" htmlFor="msg-title" muted>
            <TextField compact filled hideLabel id="msg-title" label="Title" maxLength={60} disabled={disabled} placeholder="Your fertile window is open 🌸" value={form.title} onChange={(e) => set('title', e.target.value)} />
          </Field>
        </div>
        <Field label="Language" muted>
          <Segmented size="lg" label="Language" value={form.language} options={[{ value: 'en', label: 'EN' }, { value: 'id', label: 'ID' }]} onChange={(v) => !disabled && set('language', v)} />
        </Field>
      </div>

      <Field label="Body" htmlFor="msg-body" hint={`${form.body.length}/178`} muted>
        <TextAreaField id="msg-body" ref={bodyRef} className="min-h-[72px] rounded-[10px] bg-surface text-13 font-semibold" maxLength={178} disabled={disabled} placeholder="Hi {first_name}, peak day is likely tomorrow." value={form.body} onChange={(e) => set('body', e.target.value)} />
      </Field>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-12 font-semibold text-ink-faint">Insert:</span>
        {VARIABLES.map((v) => (
          <button key={v} type="button" disabled={disabled} className="rounded-md bg-secondary-soft px-2 py-[3px] font-mono text-11 font-bold text-secondary disabled:opacity-45" onClick={() => insert(v)}>
            {v}
          </button>
        ))}
      </div>

      {isPush && (
        <div className="flex flex-col gap-2 rounded-xl bg-warning-soft p-3.5">
          <span className="flex items-center gap-2 text-12 font-bold text-warning-ink"><EyeSlash size={15} />Discreet variant (required) — for users with discreet mode on</span>
          <TextField compact hideLabel id="msg-discreet" label="Discreet variant" disabled={disabled} maxLength={80} value={form.discreet_body} onChange={(e) => set('discreet_body', e.target.value)} />
        </div>
      )}

      <div className="grid gap-4 min-[700px]:grid-cols-2">
        <Field label="Deep link" htmlFor="msg-link" muted>
          <TextField compact filled hideLabel id="msg-link" label="Deep link" disabled={disabled} placeholder="srikandi://log/lh" value={form.deep_link} onChange={(e) => set('deep_link', e.target.value)} />
        </Field>
        <Field label="Category" htmlFor="msg-category" muted>
          <SelectField
            id="msg-category"
            triggerClassName={SELECT}
            disabled={disabled}
            value={form.category}
            options={['', 'Cycle · fertile window', 'Cycle · 2WW', 'Content', 'Care', 'Promo', 'Product', 'Partner'].map((c) => ({ value: c, label: c || 'Choose a category' }))}
            onChange={(v) => set('category', v)}
          />
        </Field>
      </div>
    </StepCard>
  )
}
