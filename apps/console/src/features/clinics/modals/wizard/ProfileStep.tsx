import { Link as LinkIcon, Trash } from '@phosphor-icons/react'
import { cn } from '../../../../shared/lib/cn'
import { ChipToggleGroup, Field, ImageUpload, ModalSection, TextAreaField, TextField } from '../../../../shared/ui'
import { FACILITIES, TYPE, TYPE_ORDER } from '../../config/labels'
import type { StepProps } from './shared'

const MAX_PHOTOS = 4

export function ProfileStep({ form, set }: StepProps) {
  return (
    <>
      <ModalSection label="Clinic identity">
        <div className="grid gap-3.5 min-[701px]:grid-cols-2">
          <Field label="Clinic name" htmlFor="cw-name" required><TextField id="cw-name" label="" hideLabel maxLength={80} value={form.name} onChange={(e) => set({ name: e.target.value })} /></Field>
          <Field label="Legal entity" htmlFor="cw-legal"><TextField id="cw-legal" label="" hideLabel maxLength={120} placeholder="e.g. PT Morula Sehat Indonesia" value={form.legal_entity} onChange={(e) => set({ legal_entity: e.target.value })} /></Field>
        </div>
        <Field label="Clinic type" required>
          <div className="grid grid-cols-2 gap-2.5 min-[701px]:grid-cols-4" role="radiogroup" aria-label="Clinic type">
            {TYPE_ORDER.map((t) => {
              const Glyph = TYPE[t].icon
              const on = form.type === t
              return (
                <button key={t} type="button" role="radio" aria-checked={on} className={cn('flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-12 font-bold', on ? 'border-primary bg-primary-soft text-primary' : 'border-border bg-card')} onClick={() => set({ type: t })}>
                  <Glyph size={22} />
                  {TYPE[t].label}
                </button>
              )
            })}
          </div>
        </Field>
        <Field label="Short description" htmlFor="cw-desc" hint={`${form.description.length} / 200`}>
          <TextAreaField id="cw-desc" maxLength={200} value={form.description} onChange={(e) => set({ description: e.target.value })} />
        </Field>
      </ModalSection>

      <ModalSection label="Photos">
        <div className="grid grid-cols-2 gap-3 min-[701px]:grid-cols-4">
          {form.photos.map((url) => (
            <div key={url} className="group relative aspect-[3/2] overflow-hidden rounded-xl bg-surface-alt">
              <img src={url} alt="" className="size-full object-cover" />
              <button type="button" aria-label="Remove photo" className="absolute top-1.5 right-1.5 inline-flex size-7 items-center justify-center rounded-full bg-ink/70 text-white" onClick={() => set({ photos: form.photos.filter((p) => p !== url) })}><Trash size={13} /></button>
            </div>
          ))}
          {form.photos.length < MAX_PHOTOS && <ImageUpload value={null} folder="/clinics" label="Add photo" aspectClassName="aspect-[3/2]" onChange={(img) => img && set({ photos: [...form.photos, img.url] })} />}
        </div>
        <p className="m-0 text-11 text-ink-muted">Up to {MAX_PHOTOS} photos. The first one is the cover in Find a specialist.</p>
      </ModalSection>

      <ModalSection label="Contact">
        <div className="grid gap-3.5 min-[701px]:grid-cols-3">
          <Field label="Phone" htmlFor="cw-phone"><TextField id="cw-phone" label="" hideLabel inputMode="tel" maxLength={30} placeholder="+62 21 5678 9012" value={form.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
          <Field label="WhatsApp" htmlFor="cw-wa"><TextField id="cw-wa" label="" hideLabel inputMode="tel" maxLength={30} placeholder="+62 811 3300 4455" value={form.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} /></Field>
          <Field label="Email" htmlFor="cw-email"><TextField id="cw-email" label="" hideLabel type="email" maxLength={120} placeholder="halo@clinic.id" value={form.email} onChange={(e) => set({ email: e.target.value })} /></Field>
        </div>
        <Field label="Website" htmlFor="cw-web"><TextField id="cw-web" label="" hideLabel maxLength={200} placeholder="https://" trailing={<LinkIcon size={15} className="text-ink-faint" />} value={form.website} onChange={(e) => set({ website: e.target.value })} /></Field>
      </ModalSection>

      <ModalSection label="Facilities">
        <ChipToggleGroup label="Facilities" options={FACILITIES} selected={form.facilities} onChange={(facilities) => set({ facilities })} />
      </ModalSection>
    </>
  )
}
