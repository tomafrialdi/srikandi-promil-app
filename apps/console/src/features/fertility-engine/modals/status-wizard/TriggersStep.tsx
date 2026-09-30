import { Bell, CalendarCheck, Envelope, Users, X, type Icon } from '@phosphor-icons/react'
import { ChipToggleGroup, Field, ModalSection, SelectField, Toggle, ToggleRow } from '../../../../shared/ui'
import type { TriggerItem } from '../../types'
import { CONTENT_TAGS, defaultTriggers, type StatusForm } from './status-form'

interface StepProps {
  form: StatusForm
  update: (patch: Partial<StatusForm>) => void
}

const ICON: Record<TriggerItem['type'], Icon> = { push: Bell, partner: Users, reminder: CalendarCheck, email: Envelope }
const TYPE_LABEL: Record<TriggerItem['type'], string> = { push: 'Push to user', partner: 'Partner alert', reminder: 'Schedule reminder', email: 'Weekly email digest' }

export function TriggersStep({ form, update }: StepProps) {
  const setTrigger = (key: string, patch: Partial<TriggerItem>) => update({ triggers: form.triggers.map((t) => (t.key === key ? { ...t, ...patch } : t)) })
  const missing = (['push', 'partner', 'reminder', 'email'] as const).filter((type) => !form.triggers.some((t) => t.type === type))
  const setOut = (patch: Partial<StatusForm['outputs']>) => update({ outputs: { ...form.outputs, ...patch } })

  return (
    <>
      <ModalSection label="Notifications on entry">
        <div className="flex flex-col gap-2.5">
          {form.triggers.map((t) => {
            const Glyph = ICON[t.type]
            return (
              <div key={t.key} className="flex items-center gap-3 rounded-xl bg-surface px-3.5 py-3">
                <span className="inline-flex size-9 flex-none items-center justify-center rounded-lg border border-border bg-card text-primary">
                  <Glyph size={16} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-13 font-bold">{t.title}</span>
                  <input className="w-full border-0 bg-transparent p-0 text-12 font-medium outline-0 placeholder:text-ink-faint" aria-label={`${t.title} text`} placeholder="Message text" value={t.text} maxLength={140} onChange={(e) => setTrigger(t.key, { text: e.target.value })} />
                  {t.detail && <span className="text-11 text-ink-faint">{t.detail}</span>}
                </div>
                <Toggle label={t.title} checked={t.enabled} onChange={(enabled) => setTrigger(t.key, { enabled })} />
                <button type="button" aria-label={`Remove ${t.title}`} className="inline-flex size-6 flex-none items-center justify-center text-ink-faint hover:text-error" onClick={() => update({ triggers: form.triggers.filter((x) => x.key !== t.key) })}>
                  <X size={14} />
                </button>
              </div>
            )
          })}
        </div>
        {missing.length > 0 && (
          <div className="max-w-64">
            <SelectField aria-label="Add trigger" value="" options={[{ value: '', label: '+ Add trigger' }, ...missing.map((m) => ({ value: m, label: TYPE_LABEL[m] }))]} onChange={(type) => {
              const base = defaultTriggers(form.name).find((d) => d.type === type)
              if (base) update({ triggers: [...form.triggers, { ...base, enabled: true }] })
            }} />
          </div>
        )}
      </ModalSection>

      <ModalSection label="Data outputs">
        <ToggleRow label="Mark ovulation day in cycle history" title="Mark the day in cycle history" description="Used by Doctor report & luteal-phase personalisation" checked={form.outputs.cycle_history} onChange={(cycle_history) => setOut({ cycle_history })} />
        <ToggleRow label="Include in Doctor report" title="Include in Doctor report" description="Shows the status with dates" checked={form.outputs.doctor_report} onChange={(doctor_report) => setOut({ doctor_report })} />
        <ToggleRow label="Emit analytics event" title="Emit analytics event" description={`engine.status.${form.key || 'status_key'} → data warehouse`} checked={form.outputs.analytics_event} onChange={(analytics_event) => setOut({ analytics_event })} />
        <ToggleRow label="Webhook to partner clinic" title="Webhook to partner clinic (IUI/IVF only)" description={form.modes.includes('iui_ivf') ? 'Sent when a user enters this status' : 'Disabled — mode not included'} checked={form.outputs.clinic_webhook && form.modes.includes('iui_ivf')} disabled={!form.modes.includes('iui_ivf')} onChange={(clinic_webhook) => setOut({ clinic_webhook })} />
      </ModalSection>

      <ModalSection label="Content targeting">
        <Field label="Recommend content while in this status">
          <ChipToggleGroup label="Content" options={CONTENT_TAGS} selected={form.content_tags} onChange={(content_tags) => update({ content_tags })} />
        </Field>
      </ModalSection>
    </>
  )
}
