import { Bell, CalendarPlus, Envelope, Plus, UsersThree, X, type Icon } from '@phosphor-icons/react'
import { useState } from 'react'
import { ChipToggleGroup, Field, ModalSection, SelectField, Toggle, ToggleRow } from '../../../../shared/ui'
import type { TriggerItem } from '../../types'
import { CONTENT_TAGS, defaultTriggers, type StatusForm } from './status-form'

interface StepProps {
  form: StatusForm
  update: (patch: Partial<StatusForm>) => void
}

const ICON: Record<TriggerItem['type'], Icon> = { push: Bell, partner: UsersThree, reminder: CalendarPlus, email: Envelope }
const TYPE_LABEL: Record<TriggerItem['type'], string> = { push: 'Push to user', partner: 'Partner alert', reminder: 'Schedule reminder', email: 'Weekly email digest' }

export function TriggersStep({ form, update }: StepProps) {
  const [adding, setAdding] = useState(false)
  const setTrigger = (key: string, patch: Partial<TriggerItem>) => update({ triggers: form.triggers.map((t) => (t.key === key ? { ...t, ...patch } : t)) })
  const missing = (['push', 'partner', 'reminder', 'email'] as const).filter((type) => !form.triggers.some((t) => t.type === type))
  const setOut = (patch: Partial<StatusForm['outputs']>) => update({ outputs: { ...form.outputs, ...patch } })

  return (
    <>
      <ModalSection label="Notifications on entry" action={missing.length > 0 ? <button type="button" className="inline-flex items-center gap-1 text-12 font-bold text-primary" onClick={() => setAdding((a) => !a)}><Plus size={12} weight="bold" /> Add trigger</button> : undefined}>
        <div className="flex flex-col gap-2.5">
          {form.triggers.map((t) => {
            const Glyph = ICON[t.type]
            return (
              <div key={t.key} className="flex items-center gap-3.5 rounded-xl bg-surface px-3.5 py-3.5">
                <span className="inline-flex size-[34px] flex-none items-center justify-center rounded-[9px] border border-border bg-card text-primary">
                  <Glyph size={16} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-13 font-bold">{t.title}</span>
                  <input className="w-full border-0 bg-transparent p-0 text-12 font-medium outline-0 placeholder:text-ink-faint" aria-label={`${t.title} text`} placeholder="Message text" value={t.text} maxLength={140} onChange={(e) => setTrigger(t.key, { text: e.target.value })} />
                  {t.detail && <span className="text-11 font-medium text-ink-faint">{t.detail}</span>}
                </div>
                <Toggle size="md" label={t.title} checked={t.enabled} onChange={(enabled) => setTrigger(t.key, { enabled })} />
                <button type="button" aria-label={`Remove ${t.title}`} className="inline-flex size-6 flex-none items-center justify-center text-ink-faint hover:text-error" onClick={() => update({ triggers: form.triggers.filter((x) => x.key !== t.key) })}>
                  <X size={14} />
                </button>
              </div>
            )
          })}
        </div>
        {missing.length > 0 && adding && (
          <div className="max-w-64">
            <SelectField triggerClassName="h-10 rounded-[10px]" aria-label="Add trigger" value="" options={[{ value: '', label: '+ Add trigger' }, ...missing.map((m) => ({ value: m, label: TYPE_LABEL[m] }))]} onChange={(type) => {
              const base = defaultTriggers(form.name).find((d) => d.type === type)
              if (base) update({ triggers: [...form.triggers, { ...base, enabled: true }] })
            }} />
          </div>
        )}
      </ModalSection>

      <ModalSection label="Data outputs">
        <ToggleRow size="md" label="Mark ovulation day in cycle history" title={<span className="font-semibold">Mark the day in cycle history</span>} description="Used by Doctor report & luteal-phase personalisation" checked={form.outputs.cycle_history} onChange={(cycle_history) => setOut({ cycle_history })} />
        <ToggleRow size="md" label="Include in Doctor report" title={<span className="font-semibold">Include in Doctor report</span>} description="Shows the status with dates" checked={form.outputs.doctor_report} onChange={(doctor_report) => setOut({ doctor_report })} />
        <ToggleRow size="md" label="Emit analytics event" title={<span className="font-semibold">Emit analytics event</span>} description={`engine.status.${form.key || 'status_key'} → data warehouse`} checked={form.outputs.analytics_event} onChange={(analytics_event) => setOut({ analytics_event })} />
        <ToggleRow size="md" label="Webhook to partner clinic" title={<span className="font-semibold">Webhook to partner clinic (IUI/IVF only)</span>} description={form.modes.includes('iui_ivf') ? 'Sent when a user enters this status' : 'Disabled — mode not included'} checked={form.outputs.clinic_webhook && form.modes.includes('iui_ivf')} disabled={!form.modes.includes('iui_ivf')} onChange={(clinic_webhook) => setOut({ clinic_webhook })} />
      </ModalSection>

      <ModalSection label="Content targeting">
        <Field label="Recommend content while in this status">
          <ChipToggleGroup label="Content" options={CONTENT_TAGS} selected={form.content_tags} onChange={(content_tags) => update({ content_tags })} />
        </Field>
      </ModalSection>
    </>
  )
}
