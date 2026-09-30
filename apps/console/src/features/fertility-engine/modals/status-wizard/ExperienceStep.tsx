import { useState } from 'react'
import { Field, ModalSection, Segmented, SelectField, TextField, ToggleRow } from '../../../../shared/ui'
import { COLORS } from '../../engine/fields'
import { CALENDAR_MARKERS, TONES, type StatusForm } from './status-form'

interface StepProps {
  form: StatusForm
  update: (patch: Partial<StatusForm>) => void
}

const fill = (text: string) => text.replace('{dpo_next}', '14').replace('{test_date}', '12 Jun')

export function ExperienceStep({ form, update }: StepProps) {
  const [lang, setLang] = useState<'en' | 'id'>('en')
  const copy = form.experience.copy[lang]
  const tone = COLORS[form.color]
  const setCopy = (patch: Partial<typeof copy>) =>
    update({ experience: { ...form.experience, copy: { ...form.experience.copy, [lang]: { ...copy, ...patch } } } })
  const set = (patch: Partial<StatusForm['experience']>) => update({ experience: { ...form.experience, ...patch } })
  const en = form.experience.copy.en

  return (
    <>
      <ModalSection label="Home screen copy">
        <Segmented label="Language" value={lang} onChange={setLang} options={[{ value: 'en', label: 'English' }, { value: 'id', label: 'Bahasa Indonesia' }]} />
        <div className="grid gap-5 min-[701px]:grid-cols-[minmax(0,1fr)_240px]">
          <div className="flex flex-col gap-3.5">
            <Field label="Headline" htmlFor="exp-head" required hint="max 28 chars">
              <TextField id="exp-head" label="" hideLabel maxLength={28} value={copy.headline} onChange={(e) => setCopy({ headline: e.target.value })} />
            </Field>
            <Field label="Subtitle" htmlFor="exp-sub" hint="{dpo_next}, {test_date}">
              <TextField id="exp-sub" label="" hideLabel maxLength={120} value={copy.subtitle} onChange={(e) => setCopy({ subtitle: e.target.value })} />
            </Field>
            <div className="max-w-40">
              <Field label="Ring label" htmlFor="exp-ring" hint="max 6 chars">
                <TextField id="exp-ring" label="" hideLabel maxLength={6} value={copy.ring} onChange={(e) => setCopy({ ring: e.target.value })} />
              </Field>
            </div>
            <Field label="Discreet variant" htmlFor="exp-disc" hint="shown with discreet mode">
              <TextField id="exp-disc" label="" hideLabel maxLength={40} value={copy.discreet} onChange={(e) => setCopy({ discreet: e.target.value })} />
            </Field>
          </div>
          <div className="rounded-[28px] bg-ink p-2.5" aria-label="Phone preview">
            <div className="flex flex-col gap-2.5 rounded-[20px] bg-card p-3">
              <span className="text-12 font-bold">Good morning, Amara</span>
              <div className="flex items-center justify-between gap-2 rounded-xl p-3 text-white" style={{ background: tone.hex }}>
                <div className="flex min-w-0 flex-col gap-1.5">
                  <span className="w-fit rounded-full bg-white/20 px-2 py-0.5 text-10 font-semibold">{form.name || 'New status'}</span>
                  <span className="text-14 leading-tight font-extrabold break-words">{copy.headline || en.headline || 'Headline'}</span>
                  <span className="text-10 leading-snug opacity-85">{fill(copy.subtitle || en.subtitle)}</span>
                </div>
                <span className="inline-flex size-11 flex-none items-center justify-center rounded-full border-[3px] border-white/70 text-10 font-extrabold">{copy.ring || en.ring}</span>
              </div>
              <span className="rounded-lg bg-surface px-2.5 py-2 text-10 leading-snug text-ink-muted">Discreet: {copy.discreet}</span>
            </div>
          </div>
        </div>
      </ModalSection>

      <ModalSection label="Calendar & tone">
        <div className="grid gap-3.5 min-[701px]:grid-cols-2">
          <Field label="Calendar marker">
            <SelectField aria-label="Calendar marker" value={form.experience.calendar_marker} options={CALENDAR_MARKERS.map((m) => ({ value: m, label: m }))} onChange={(calendar_marker) => set({ calendar_marker })} />
          </Field>
          <Field label="Tone">
            <SelectField aria-label="Tone" value={form.experience.tone} options={TONES.map((m) => ({ value: m, label: m }))} onChange={(tone) => set({ tone })} />
          </Field>
        </div>
        <ToggleRow label="Show celebration micro-animation" title="Show celebration micro-animation" description="Subtle check animation (off in After-loss mode)" checked={form.experience.celebration} onChange={(celebration) => set({ celebration })} />
        <ToggleRow label="Hide in After-loss mode" title="Hide in After-loss mode" description="Use “Your body is finding its rhythm” instead" checked={form.experience.hide_after_loss} onChange={(hide_after_loss) => set({ hide_after_loss })} />
      </ModalSection>
    </>
  )
}
