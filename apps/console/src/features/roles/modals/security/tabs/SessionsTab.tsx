import { Desktop, DeviceMobile, Laptop, SignOut, UsersThree, type Icon } from '@phosphor-icons/react'
import { Badge, Button, ModalSection, ToggleRow } from '../../../../../shared/ui'
import { ABSOLUTE, CONCURRENT, IDLE } from '../../../config/security-options'
import { DEVICE } from '../../../config/labels'
import type { DeviceKind, SecurityData } from '../../../types'
import type { SectionProps } from '../security-draft'
import { SelectGrid, SelectSetting } from './parts'

const ICON: Record<DeviceKind, Icon> = { managed_laptop: Laptop, admin_app: DeviceMobile, browser: Desktop }

interface SessionsTabProps extends SectionProps<'sessions'> {
  data: SecurityData
  canEdit: boolean
  onSignOutAll: () => void
}

export function SessionsTab({ value, onChange, data, canEdit, onSignOutAll }: SessionsTabProps) {
  return (
    <>
      <ModalSection label="Session limits">
        <SelectGrid>
          <SelectSetting label="Idle timeout" value={value.idle_minutes} options={IDLE} onChange={(idle_minutes) => onChange({ idle_minutes })} />
          <SelectSetting label="Absolute session length" value={value.absolute_hours} options={ABSOLUTE} onChange={(absolute_hours) => onChange({ absolute_hours })} />
          <SelectSetting label="Max concurrent sessions" value={value.max_concurrent} options={CONCURRENT} onChange={(max_concurrent) => onChange({ max_concurrent })} />
        </SelectGrid>
        <ToggleRow label="Sign out everywhere on role change" title="Sign out everywhere on role change" description="Forces re-login with new permissions" checked={value.signout_on_role_change} onChange={(signout_on_role_change) => onChange({ signout_on_role_change })} />
        <ToggleRow label="Trust this device for 30 days" title="“Trust this device” for 30 days" description="Skips 2FA on managed devices only" checked={value.trust_device} onChange={(trust_device) => onChange({ trust_device })} />
      </ModalSection>

      <ModalSection label="Devices">
        <ToggleRow label="Managed devices only for data export" title="Managed devices only for data export" description="MDM-enrolled laptops (Jamf / Intune)" checked={value.managed_export_only} onChange={(managed_export_only) => onChange({ managed_export_only })} />
        <ToggleRow label="Block sign-in from mobile browsers" title="Block sign-in from mobile browsers" description="Use Srikandi Admin app instead" checked={value.block_mobile_browsers} onChange={(block_mobile_browsers) => onChange({ block_mobile_browsers })} />
        <ul className="m-0 flex list-none flex-col rounded-xl border border-border p-0">
          {data.devices.map((d) => {
            const Glyph = ICON[d.kind]
            const review = d.kind === 'browser' && d.active > 0
            return (
              <li key={d.kind} className="flex items-center gap-3 border-b border-border px-3.5 py-3 last:border-b-0">
                <Glyph size={16} className="flex-none text-ink-muted" />
                <span className="flex-1 text-13 font-semibold">{DEVICE[d.kind].label}</span>
                <span className="text-12 font-semibold">{d.active} active</span>
                <Badge tone={review ? 'warning' : d.kind === 'admin_app' ? 'info' : 'success'}>{review ? 'Review' : 'OK'}</Badge>
              </li>
            )
          })}
        </ul>
      </ModalSection>

      <ModalSection label="Active sessions now">
        <div className="flex flex-wrap items-center gap-3 rounded-xl bg-surface px-3.5 py-3">
          <UsersThree size={18} className="flex-none text-ink-muted" />
          <span className="min-w-0 flex-1 text-13 font-bold">
            {data.sessions.active} active session{data.sessions.active === 1 ? '' : 's'} across {data.sessions.members} member{data.sessions.members === 1 ? '' : 's'}
          </span>
          <Button variant="danger" onClick={onSignOutAll} disabled={!canEdit} leadingIcon={<SignOut size={16} />}>Sign out all</Button>
        </div>
      </ModalSection>
    </>
  )
}
