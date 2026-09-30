import { Field, Segmented, SelectField, ToggleRow, DateField } from '../../../../shared/ui'
import { DELIVERY_OPTIONS, SEND_TIMES, TRIGGER_EVENTS } from '../../config/editor'
import type { CampaignForm, Delivery } from '../../types'
import { StepCard } from './StepCard'

interface DeliverySectionProps {
  form: CampaignForm
  set: <K extends keyof CampaignForm>(key: K, value: CampaignForm[K]) => void
  disabled?: boolean
}

export function DeliverySection({ form, set, disabled }: DeliverySectionProps) {
  const isPush = form.channel === 'push'
  return (
    <StepCard n={4} title="Delivery">
      <Segmented label="Delivery" value={form.delivery} options={DELIVERY_OPTIONS as Array<{ value: Delivery; label: string }>} onChange={(v) => !disabled && set('delivery', v)} />

      {form.delivery === 'trigger' && (
        <div className="grid gap-4 min-[700px]:grid-cols-2">
          <Field label="Event" htmlFor="trigger-event">
            <SelectField id="trigger-event" disabled={disabled} value={form.trigger_event} options={TRIGGER_EVENTS.map((e) => ({ value: e, label: e }))} onChange={(v) => set('trigger_event', v)} />
          </Field>
          <Field label="Send at" htmlFor="send-time">
            <SelectField id="send-time" disabled={disabled} value={form.send_time} options={SEND_TIMES.map((e) => ({ value: e, label: e }))} onChange={(v) => set('send_time', v)} />
          </Field>
        </div>
      )}
      {form.delivery === 'scheduled' && (
        <Field label="Send at" htmlFor="send-at" hint="your local time">
          <DateField id="send-at" withTime disabled={disabled} className="max-w-80" value={form.send_at} onChange={(v) => set('send_at', v)} />
        </Field>
      )}
      {form.delivery === 'now' && <p className="text-13 text-ink-muted">The campaign is queued as soon as you send it.</p>}

      <div className="flex flex-col gap-3.5">
        {isPush && <ToggleRow label="Respect quiet hours" title="Respect quiet hours (21:00–07:00)" description="Held until 07:00 instead of buzzing at night" checked={form.quiet_hours} onChange={(v) => set('quiet_hours', v)} disabled={disabled} />}
        <ToggleRow label="Max 1 cycle push per day" title="Max 1 cycle push / day" description="Skip users who already got one today" checked={form.max_one_per_day} onChange={(v) => set('max_one_per_day', v)} disabled={disabled} />
        <ToggleRow label="A/B test title" title="A/B test title" description="Send two titles to a small share first" checked={form.ab_test} onChange={(v) => set('ab_test', v)} disabled={disabled} />
      </div>
    </StepCard>
  )
}
