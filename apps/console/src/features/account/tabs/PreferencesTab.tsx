import { useState } from 'react'
import { Button, Card, CardHeader, Field, Segmented, SelectField, ToggleRow, Tooltip, TooltipBody, useToast } from '../../../shared/ui'
import { cn } from '../../../shared/lib/cn'
import { usePreferences } from '../../../shared/preferences/preferences-context'
import type { DisplayPrefs } from '../../../shared/preferences/types'
import { CURRENCY_OPTIONS, DATE_FORMAT_OPTIONS, DATE_RANGE_OPTIONS, LANDING_OPTIONS, LANGUAGE_OPTIONS, TIMEZONE_OPTIONS } from '../config/options'

const THEMES = [
  { key: 'light', label: 'Light', available: true },
  { key: 'dark', label: 'Dark', available: false },
  { key: 'system', label: 'System', available: false },
]

export function PreferencesTab() {
  const toast = useToast()
  const { prefs, save } = usePreferences()
  const [draft, setDraft] = useState<DisplayPrefs>(prefs.display)
  const [busy, setBusy] = useState(false)
  const dirty = JSON.stringify(draft) !== JSON.stringify(prefs.display)
  const patch = (change: Partial<DisplayPrefs>) => setDraft((d) => ({ ...d, ...change }))

  const submit = async () => {
    setBusy(true)
    try {
      await save('display', draft)
      toast({ title: 'Preferences saved' })
    } catch (err) {
      toast({ tone: 'error', title: 'Could not save', description: err instanceof Error ? err.message : undefined })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader title="Appearance" />
        <div className="grid gap-3 min-[700px]:grid-cols-3" role="radiogroup" aria-label="Theme">
          {THEMES.map((t) => {
            const card = (
              <button
                key={t.key}
                type="button"
                role="radio"
                aria-checked={draft.theme === t.key}
                disabled={!t.available}
                className={cn('flex w-full flex-col gap-2 rounded-xl border p-3 text-left disabled:opacity-50', draft.theme === t.key ? 'border-primary bg-primary-soft' : 'border-border')}
                onClick={() => patch({ theme: t.key as DisplayPrefs['theme'] })}
              >
                <span className={cn('flex h-14 gap-1 rounded-lg p-1.5', t.key === 'dark' ? 'bg-ink' : 'bg-surface')}>
                  <span className={cn('w-1/4 rounded', t.key === 'dark' ? 'bg-white/15' : 'bg-card')} />
                  <span className={cn('flex-1 rounded', t.key === 'dark' ? 'bg-white/25' : 'bg-card')} />
                </span>
                <span className="text-13 font-bold">{t.label}</span>
              </button>
            )
            return t.available ? card : (
              <Tooltip key={t.key} className="block" content={<TooltipBody title={`${t.label} theme is coming soon`} />}>{card}</Tooltip>
            )
          })}
        </div>
        <Field label="Table density">
          <Segmented label="Table density" value={draft.density} options={[{ value: 'comfortable', label: 'Comfortable' }, { value: 'compact', label: 'Compact' }]} onChange={(v) => patch({ density: v })} />
        </Field>
      </Card>

      <Card>
        <CardHeader title="Language & region" />
        <div className="grid gap-4 min-[700px]:grid-cols-2">
          <Field label="Console language" htmlFor="pref-lang"><SelectField id="pref-lang" value={draft.language} options={LANGUAGE_OPTIONS} onChange={(v) => patch({ language: v })} /></Field>
          <Field label="Content preview language" htmlFor="pref-content-lang"><SelectField id="pref-content-lang" value={draft.content_language} options={LANGUAGE_OPTIONS} onChange={(v) => patch({ content_language: v })} /></Field>
          <Field label="Time zone" htmlFor="pref-tz"><SelectField id="pref-tz" value={draft.timezone} options={TIMEZONE_OPTIONS} onChange={(v) => patch({ timezone: v })} /></Field>
          <Field label="Date format" htmlFor="pref-date"><SelectField id="pref-date" value={draft.date_format} options={DATE_FORMAT_OPTIONS} onChange={(v) => patch({ date_format: v })} /></Field>
          <Field label="Currency" htmlFor="pref-currency"><SelectField id="pref-currency" value={draft.currency} options={CURRENCY_OPTIONS} onChange={(v) => patch({ currency: v })} /></Field>
        </div>
      </Card>

      <Card>
        <CardHeader title="Defaults" />
        <div className="grid gap-4 min-[700px]:grid-cols-2">
          <Field label="Landing page after sign-in" htmlFor="pref-landing"><SelectField id="pref-landing" value={draft.landing} options={LANDING_OPTIONS} onChange={(v) => patch({ landing: v })} /></Field>
          <Field label="Default date range" htmlFor="pref-range"><SelectField id="pref-range" value={draft.date_range} options={DATE_RANGE_OPTIONS} onChange={(v) => patch({ date_range: v })} /></Field>
        </div>
        <ToggleRow label="Keep health data masked" title="Keep health data masked in screenshots & exports" description="Recommended — watermark + blur" checked={draft.mask_exports} onChange={(v) => patch({ mask_exports: v })} />
        <ToggleRow label="Keyboard shortcuts" title="Keyboard shortcuts" description="⌘K search · G then U for Users" checked={draft.shortcuts} onChange={(v) => patch({ shortcuts: v })} />
      </Card>

      <div className="flex justify-end gap-2.5">
        <Button variant="outline" disabled={!dirty || busy} onClick={() => setDraft(prefs.display)}>Cancel</Button>
        <Button disabled={!dirty || busy} onClick={submit}>{busy ? 'Saving…' : 'Save changes'}</Button>
      </div>
    </>
  )
}
