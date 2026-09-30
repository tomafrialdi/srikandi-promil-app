import { BellRinging } from '@phosphor-icons/react'
import { useState } from 'react'
import { Segmented } from '../../../../shared/ui'
import { formatNumber } from '../../../../shared/lib/format'
import { SAMPLE } from '../../config/editor'
import { CHANNEL_META } from '../../config/labels'
import type { CampaignForm } from '../../types'

const fill = (text: string) => text.replace(/\{[a-z_]+\}/g, (m) => SAMPLE[m] ?? m)

interface PreviewColumnProps {
  form: CampaignForm
  reach?: number
}

export function PreviewColumn({ form, reach }: PreviewColumnProps) {
  const [view, setView] = useState<'normal' | 'discreet'>('normal')
  const discreet = view === 'discreet'
  const [today] = useState(() => new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()))

  const summary: Array<[string, string]> = [
    ['Channel', CHANNEL_META[form.channel].label],
    ['Audience', reach != null ? `~${formatNumber(reach)}${form.delivery === 'trigger' ? ' / day' : ''}` : '…'],
    ['Trigger', form.delivery === 'trigger' ? form.trigger_event.replace(/^.*→ /, '') : form.delivery === 'scheduled' ? 'Scheduled' : 'Send now'],
    ['Est. cost', form.channel === 'push' ? 'Free (FCM/APNs)' : form.channel === 'in_app' ? 'Free' : 'Per email sent'],
    ['Approval', 'Required · health claim check'],
  ]

  return (
    <aside className="flex w-full flex-none flex-col gap-4 min-[1201px]:w-90">
      <section className="flex flex-col gap-3.5 rounded-card bg-ink p-5 text-white">
        <header className="flex items-center justify-between gap-3">
          <h2 className="text-15 font-bold">Lock screen preview</h2>
          <Segmented label="Preview mode" value={view} options={[{ value: 'normal', label: 'Normal' }, { value: 'discreet', label: 'Discreet' }]} onChange={setView} />
        </header>
        <div className="flex flex-col items-center gap-0.5 py-3">
          <span className="text-12 font-medium text-white/70">{today}</span>
          <span className="text-[56px] leading-none font-light">07:00</span>
        </div>
        <div className="flex gap-2.5 rounded-2xl bg-white/15 p-3">
          <span className="inline-flex size-9 flex-none items-center justify-center rounded-lg bg-primary text-white"><BellRinging size={18} weight="fill" /></span>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <div className="flex items-center justify-between text-10 font-bold tracking-wide text-white/70">
              <span>{discreet ? 'KALENDER · discreet' : 'SRIKANDI PROMIL'}</span>
              <span className="font-medium">now</span>
            </div>
            <span className="text-13 font-bold">{discreet ? form.discreet_body || 'Daily reminder' : fill(form.title) || 'Your title'}</span>
            {!discreet && <span className="text-12 leading-snug text-white/85">{fill(form.body) || 'Your message body appears here.'}</span>}
          </div>
        </div>
        {form.channel !== 'push' && <p className="text-11 text-white/60">Shown as a push for reference. {CHANNEL_META[form.channel].label} uses the same title and body.</p>}
      </section>

      <section className="flex flex-col gap-2.5 rounded-card border border-border bg-card p-5">
        <h2 className="text-15 font-bold">Summary</h2>
        {summary.map(([key, value]) => (
          <div key={key} className="flex items-baseline justify-between gap-4 text-13">
            <span className="text-ink-muted">{key}</span>
            <span className="text-right font-bold">{value}</span>
          </div>
        ))}
      </section>
    </aside>
  )
}
