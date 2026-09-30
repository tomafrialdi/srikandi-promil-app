import { Segmented, TextField } from '../../../../shared/ui'
import { CHANNEL_META } from '../../config/labels'
import type { CampaignForm, NotificationChannel } from '../../types'
import { StepCard } from './StepCard'

interface SectionProps {
  form: CampaignForm
  set: <K extends keyof CampaignForm>(key: K, value: CampaignForm[K]) => void
  disabled?: boolean
}

export function CampaignSection({ form, set, disabled }: SectionProps) {
  return (
    <StepCard n={1} title="Campaign">
      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-60 flex-1">
          <TextField id="campaign-name" label="Campaign name" maxLength={120} disabled={disabled} placeholder="Fertile window opens — LH nudge" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-13 font-bold">Channel</span>
          <Segmented
            label="Channel"
            value={form.channel}
            options={(Object.keys(CHANNEL_META) as NotificationChannel[]).map((value) => ({ value, label: CHANNEL_META[value].label }))}
            onChange={(v) => !disabled && set('channel', v)}
          />
        </div>
      </div>
    </StepCard>
  )
}
