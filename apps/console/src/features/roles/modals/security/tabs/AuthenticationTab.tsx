import { ShieldCheck } from '@phosphor-icons/react'
import { ModalSection, ToggleRow } from '../../../../../shared/ui'
import { HISTORY, MIN_LENGTH, PRIVILEGED_RULES, ROTATION } from '../../../config/security-options'
import type { SecurityData } from '../../../types'
import type { SectionProps } from '../security-draft'
import { Locked, SelectGrid, SelectSetting, Tile } from './parts'

export function AuthenticationTab({ value, onChange, stats }: SectionProps<'authentication'> & { stats: SecurityData['stats'] }) {
  return (
    <>
      <ModalSection label="Sign-in methods">
        <ToggleRow label="Require Google Workspace SSO" title="Require Google Workspace SSO" description="For @srikandipromil.id accounts · partner clinics use email + password" checked={value.sso} onChange={(sso) => onChange({ sso })} />
        <ToggleRow label="Require two-factor authentication" title={<Locked>Require two-factor authentication</Locked>} description="Enforced for everyone · cannot be disabled" checked disabled onChange={() => undefined} />
        <ToggleRow label="Allow passkeys" title="Allow passkeys (WebAuthn)" description="Face ID, Touch ID, Windows Hello, security keys" checked={value.passkeys} onChange={(passkeys) => onChange({ passkeys })} />
        <ToggleRow label="Allow SMS as 2FA fallback" title="Allow SMS as 2FA fallback" description="Not recommended — SIM-swap risk" checked={value.sms_fallback} onChange={(sms_fallback) => onChange({ sms_fallback })} />
      </ModalSection>

      <ModalSection label="Password policy">
        <SelectGrid>
          <SelectSetting label="Minimum length" value={value.min_length} options={MIN_LENGTH} onChange={(min_length) => onChange({ min_length })} />
          <SelectSetting label="Rotation" value={value.rotation_days} options={ROTATION} onChange={(rotation_days) => onChange({ rotation_days })} />
          <SelectSetting label="History" value={value.history} options={HISTORY} onChange={(history) => onChange({ history })} />
        </SelectGrid>
        <ToggleRow label="Block breached passwords" title="Block breached passwords" description="Checked against HaveIBeenPwned (k-anonymity)" checked={value.block_breached} onChange={(block_breached) => onChange({ block_breached })} />
      </ModalSection>

      <ModalSection label="Stronger rules for privileged roles">
        <dl className="m-0 flex flex-col gap-2 rounded-xl bg-surface px-3.5 py-3">
          {PRIVILEGED_RULES.map((r) => (
            <div key={r.who} className="grid items-center gap-x-4 min-[701px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <dt className="flex items-center gap-2 text-12 font-bold">
                <ShieldCheck size={14} className="flex-none text-primary" />
                {r.who}
              </dt>
              <dd className="m-0 text-12 text-ink-muted">{r.rule}</dd>
            </div>
          ))}
        </dl>
      </ModalSection>

      <div className="grid gap-3 min-[701px]:grid-cols-3">
        <Tile tone="success" label="2FA enrolled" value={`${stats.tfa} / ${stats.members}`} />
        <Tile tone="warning" label="Passkey enrolled" value={`${stats.passkeys} / ${stats.members}`} />
        {value.rotation_days > 0 ? (
          <Tile tone="error" label={`Password > ${value.rotation_days} days`} value={`${stats.stale_passwords} member${stats.stale_passwords === 1 ? '' : 's'}`} />
        ) : (
          <Tile tone="info" label="Password rotation" value="Off" />
        )}
      </div>
    </>
  )
}
