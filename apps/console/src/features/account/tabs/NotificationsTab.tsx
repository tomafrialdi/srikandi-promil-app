import { Warning } from '@phosphor-icons/react'
import { useState } from 'react'
import { Button, Card, CardHeader, Checkbox, Field, Notice, SelectField, Toggle, useToast } from '../../../shared/ui'
import { NOTIFICATION_EVENTS } from '../../../shared/preferences/defaults'
import { usePreferences } from '../../../shared/preferences/preferences-context'
import type { NotificationPrefs } from '../../../shared/preferences/types'
import { TIMEZONE_OPTIONS } from '../config/options'

const CHANNELS = [
  { key: 'email', label: 'Email', note: 'Your work email' },
  { key: 'slack', label: 'Slack', note: '#admin-alerts · DM' },
  { key: 'push', label: 'Push (Srikandi Admin app)', note: 'Your phone' },
  { key: 'sms', label: 'SMS', note: 'Critical only' },
] as const

const timeInput = 'h-11 w-full rounded-control border border-border bg-card px-3.5 text-13 font-semibold outline-0 focus-visible:border-primary'

export function NotificationsTab() {
  const toast = useToast()
  const { prefs, save } = usePreferences()
  const [draft, setDraft] = useState<NotificationPrefs>(prefs.notifications)
  const [busy, setBusy] = useState(false)
  const dirty = JSON.stringify(draft) !== JSON.stringify(prefs.notifications)

  const submit = async () => {
    setBusy(true)
    try {
      await save('notifications', draft)
      toast({ title: 'Notification settings saved' })
    } catch (err) {
      toast({ tone: 'error', title: 'Could not save', description: err instanceof Error ? err.message : undefined })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Notice icon={<Warning size={16} />}>Your choices are saved now. Email, Slack, push and SMS delivery switch on as each integration is connected.</Notice>

      <Card>
        <CardHeader title="Delivery channels" />
        <div className="grid gap-3 min-[700px]:grid-cols-2">
          {CHANNELS.map((c) => (
            <div key={c.key} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3.5">
              <div className="flex flex-col gap-0.5">
                <span className="text-13 font-bold">{c.label}</span>
                <span className="text-12 text-ink-muted">{c.note}</span>
              </div>
              <Toggle label={c.label} checked={draft.channels[c.key]} onChange={(v) => setDraft({ ...draft, channels: { ...draft.channels, [c.key]: v } })} />
            </div>
          ))}
        </div>
      </Card>

      <Card className="gap-2">
        <CardHeader title="Notify me about" subtitle="Per event type and channel" />
        <div className="overflow-x-auto">
          <div className="min-w-120">
            <div className="grid grid-cols-[1fr_64px_64px_64px] items-center gap-2 py-2 text-11 font-bold text-ink-faint">
              <span>EVENT</span><span className="text-center">EMAIL</span><span className="text-center">SLACK</span><span className="text-center">PUSH</span>
            </div>
            {NOTIFICATION_EVENTS.map((e) => {
              const row = draft.events[e.key] ?? { email: false, slack: false, push: false }
              return (
                <div key={e.key} className="grid grid-cols-[1fr_64px_64px_64px] items-center gap-2 border-t border-border py-3">
                  <span className="flex flex-col gap-0.5">
                    <span className="text-13 font-semibold">{e.label}</span>
                    {'note' in e && <span className="text-11 text-ink-faint">{e.note}</span>}
                  </span>
                  {(['email', 'slack', 'push'] as const).map((ch) => (
                    <span key={ch} className="flex justify-center">
                      <Checkbox
                        label={`${e.label} by ${ch}`}
                        checked={'locked' in e ? true : row[ch]}
                        onChange={(v) => !('locked' in e) && setDraft({ ...draft, events: { ...draft.events, [e.key]: { ...row, [ch]: v } } })}
                      />
                    </span>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Quiet hours"
          subtitle="Non-critical notifications are held until the morning"
          action={<Toggle label="Quiet hours" checked={draft.quiet.enabled} onChange={(v) => setDraft({ ...draft, quiet: { ...draft.quiet, enabled: v } })} />}
        />
        <div className="grid gap-4 min-[700px]:grid-cols-3">
          <Field label="From" htmlFor="quiet-from"><input id="quiet-from" type="time" className={timeInput} disabled={!draft.quiet.enabled} value={draft.quiet.from} onChange={(e) => setDraft({ ...draft, quiet: { ...draft.quiet, from: e.target.value } })} /></Field>
          <Field label="To" htmlFor="quiet-to"><input id="quiet-to" type="time" className={timeInput} disabled={!draft.quiet.enabled} value={draft.quiet.to} onChange={(e) => setDraft({ ...draft, quiet: { ...draft.quiet, to: e.target.value } })} /></Field>
          <Field label="Time zone" htmlFor="quiet-tz"><SelectField id="quiet-tz" disabled={!draft.quiet.enabled} value={draft.quiet.tz} options={TIMEZONE_OPTIONS} onChange={(v) => setDraft({ ...draft, quiet: { ...draft.quiet, tz: v } })} /></Field>
        </div>
      </Card>

      <div className="flex justify-end gap-2.5">
        <Button variant="outline" disabled={!dirty || busy} onClick={() => setDraft(prefs.notifications)}>Cancel</Button>
        <Button disabled={!dirty || busy} onClick={submit}>{busy ? 'Saving…' : 'Save changes'}</Button>
      </div>
    </>
  )
}
