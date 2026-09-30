import { ChatCircleText, PhoneCall, UserGear, UsersThree, type Icon } from '@phosphor-icons/react'
import { Badge, ModalSection, Toggle, ToggleRow } from '../../../../../shared/ui'
import { SEVERITY } from '../../../config/labels'
import type { AlertRule, SecurityData } from '../../../types'
import type { SectionProps } from '../security-draft'

interface AlertsTabProps extends SectionProps<'alerts'> {
  data: SecurityData
  rules: AlertRule[]
  enabled: Record<string, boolean>
  onRule: (key: string, on: boolean) => void
}

export function AlertsTab({ value, onChange, data, rules, enabled, onRule }: AlertsTabProps) {
  const notify: Array<{ icon: Icon; title: string; detail: string }> = [
    { icon: UsersThree, title: 'Super admins', detail: `${data.super_admins} people` },
    { icon: UserGear, title: 'DPO', detail: data.policy.data.dpo_name },
    { icon: ChatCircleText, title: 'Slack', detail: value.channels.slack },
    { icon: PhoneCall, title: 'On-call phone', detail: value.channels.oncall },
  ]

  return (
    <>
      <ModalSection label="Alert rules">
        <ul className="m-0 flex list-none flex-col rounded-xl border border-border p-0">
          {rules.map((rule) => (
            <li key={rule.key} className="flex items-center gap-3 border-b border-border px-3.5 py-3 last:border-b-0">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-13 font-bold">{rule.label}</span>
                <span className="text-11 text-ink-muted">{rule.description}</span>
              </div>
              <Badge tone={SEVERITY[rule.severity].tone}>{SEVERITY[rule.severity].label}</Badge>
              <Toggle label={rule.label} checked={enabled[rule.key] ?? rule.enabled} onChange={(on) => onRule(rule.key, on)} />
            </li>
          ))}
        </ul>
      </ModalSection>

      <ModalSection label="Who gets notified">
        <div className="grid grid-cols-2 gap-3 min-[701px]:grid-cols-4">
          {notify.map(({ icon: Glyph, title, detail }) => (
            <div key={title} className="flex flex-col gap-1.5 rounded-xl bg-surface px-3.5 py-3">
              <Glyph size={16} className="text-primary" />
              <span className="text-13 font-bold">{title}</span>
              <span className="text-11 text-ink-muted">{detail}</span>
            </div>
          ))}
        </div>
      </ModalSection>

      <ModalSection label="Automatic response">
        <ToggleRow label="Auto-lock account on High alerts" title="Auto-lock account on High alerts" description="Member must contact a Super admin to unlock" checked={value.auto_lock_high} onChange={(auto_lock_high) => onChange({ auto_lock_high })} />
        <ToggleRow label="Force re-authentication on Medium alerts" title="Force re-authentication on Medium alerts" description="Passkey or security key" checked={value.reauth_medium} onChange={(reauth_medium) => onChange({ reauth_medium })} />
      </ModalSection>
    </>
  )
}
