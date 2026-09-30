import { Lightning } from '@phosphor-icons/react'
import { DateField, Field, Segmented, SelectField, Toggle } from '../../../../shared/ui'
import { DELIVERY_OPTIONS, SEND_TIMES, TRIGGER_EVENTS } from '../../config/editor'
import type { CampaignForm, Delivery } from '../../types'
import { StepCard } from './StepCard'

interface DeliverySectionProps {
  form: CampaignForm
  set: <K extends keyof CampaignForm>(key: K, value: CampaignForm[K]) => void
  disabled?: boolean
}

const SELECT = 'h-10 rounded-[10px] bg-surface'

function Guard({ label, hint, checked, onChange, disabled }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 text-12 font-semibold" title={hint}>
      <Toggle size="md" label={label} checked={checked} onChange={onChange} disabled={disabled} />
      {label}
    </span>
  )
}

export function DeliverySection({ form, set, disabled }: DeliverySectionProps) {
  const isPush = form.channel === 'push'
  return (
    <StepCard n={4} title="Delivery">
      <div>
        <Segmented
          size="lg"
          label="Delivery"
          value={form.delivery}
          options={(DELIVERY_OPTIONS as Array<{ value: Delivery; label: string }>).map((o) => (o.value === 'trigger' ? { ...o, icon: <Lightning size={14} weight="fill" /> } : o))}
          onChange={(v) => !disabled && set('delivery', v)}
        />
      </div>

      {form.delivery === 'trigger' && (
        <div className="grid gap-4 min-[700px]:grid-cols-2">
          <Field label="Event" htmlFor="trigger-event" muted>
            <SelectField id="trigger-event" triggerClassName={SELECT} disabled={disabled} value={form.trigger_event} options={TRIGGER_EVENTS.map((e) => ({ value: e, label: e }))} onChange={(v) => set('trigger_event', v)} />
          </Field>
          <Field label="Send at" htmlFor="send-time" muted>
            <SelectField id="send-time" triggerClassName={SELECT} disabled={disabled} value={form.send_time} options={SEND_TIMES.map((e) => ({ value: e, label: e }))} onChange={(v) => set('send_time', v)} />
          </Field>
        </div>
      )}
      {form.delivery === 'scheduled' && (
        <Field label="Send at" htmlFor="send-at" hint="your local time" muted>
          <DateField id="send-at" withTime disabled={disabled} className="h-10 max-w-80 rounded-[10px] bg-surface" value={form.send_at} onChange={(v) => set('send_at', v)} />
        </Field>
      )}
      {form.delivery === 'now' && <p className="text-13 text-ink-muted">The campaign is queued as soon as you send it.</p>}

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        {isPush && <Guard label="Respect quiet hours (21:00–07:00)" hint="Held until 07:00 instead of buzzing at night" checked={form.quiet_hours} onChange={(v) => set('quiet_hours', v)} disabled={disabled} />}
        <Guard label="Max 1 cycle push / day" hint="Skip users who already got one today" checked={form.max_one_per_day} onChange={(v) => set('max_one_per_day', v)} disabled={disabled} />
        <Guard label="A/B test title" hint="Send two titles to a small share first" checked={form.ab_test} onChange={(v) => set('ab_test', v)} disabled={disabled} />
      </div>
    </StepCard>
  )
}
