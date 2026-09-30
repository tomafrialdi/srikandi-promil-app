import { Bell, DeviceMobile, EnvelopeSimple } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { Field, Segmented, TextField } from '../../../../shared/ui'
import { CHANNEL_META } from '../../config/labels'
import type { CampaignForm, NotificationChannel } from '../../types'
import { StepCard } from './StepCard'

interface SectionProps {
  form: CampaignForm
  set: <K extends keyof CampaignForm>(key: K, value: CampaignForm[K]) => void
  disabled?: boolean
}

const CHANNEL_ICON: Record<NotificationChannel, ReactNode> = {
  push: <Bell size={14} weight="fill" />,
  in_app: <DeviceMobile size={14} />,
  email: <EnvelopeSimple size={14} />,
}

export function CampaignSection({ form, set, disabled }: SectionProps) {
  return (
    <StepCard n={1} title="Campaign">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-60 flex-1">
          <Field label="Campaign name" htmlFor="campaign-name" muted>
            <TextField compact filled hideLabel id="campaign-name" label="Campaign name" maxLength={120} disabled={disabled} placeholder="Fertile window opens — LH nudge" value={form.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
        </div>
        <Field label="Channel" muted>
          <Segmented
            size="lg"
            label="Channel"
            value={form.channel}
            options={(Object.keys(CHANNEL_META) as NotificationChannel[]).map((value) => ({ value, label: CHANNEL_META[value].label, icon: CHANNEL_ICON[value] }))}
            onChange={(v) => !disabled && set('channel', v)}
          />
        </Field>
      </div>
    </StepCard>
  )
}
