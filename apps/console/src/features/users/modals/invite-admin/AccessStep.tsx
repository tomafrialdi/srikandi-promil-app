import { Lock, ShieldCheck } from '@phosphor-icons/react'
import { useState } from 'react'
import { CheckRow, DateField, Field, ModalSection, RadioCard, SelectField, TextField, ToggleRow } from '../../../../shared/ui'
import type { InviteForm } from './invite-form'

interface StepProps {
  form: InviteForm
  update: (patch: Partial<InviteForm>) => void
}

const TIMEOUTS = [
  { value: '15', label: '15 minutes idle' },
  { value: '30', label: '30 minutes idle' },
  { value: '60', label: '60 minutes idle' },
  { value: '120', label: '2 hours idle' },
]

const title = (text: string) => <span className="font-semibold">{text}</span>

export function AccessStep({ form, update }: StepProps) {
  const access = form.access
  const set = (patch: Partial<InviteForm['access']>) => update({ access: { ...access, ...patch } })
  const [today] = useState(() => new Date().toISOString().slice(0, 10))

  return (
    <>
      <ModalSection label="Sign-in">
        <ToggleRow
          size="md"
          label="Two-factor authentication"
          title={<span className="inline-flex items-center gap-1.5 font-semibold">Two-factor authentication<Lock size={12} className="text-ink-faint" /></span>}
          description="Required for every admin (authenticator app or passkey)"
          checked
          disabled
          onChange={() => undefined}
        />
        <ToggleRow size="md" label="Sign in with Google Workspace (SSO)" title={title('Sign in with Google Workspace (SSO)')} description="Only @srikandipromil.id accounts" checked={access.sso} onChange={(sso) => set({ sso })} />
        <ToggleRow size="md" label="Allow passkeys" title={title('Allow passkeys')} description="Face ID / Touch ID / Windows Hello" checked={access.passkeys} onChange={(passkeys) => set({ passkeys })} />
      </ModalSection>

      <ModalSection label="Access window">
        <div className="grid gap-3 min-[701px]:grid-cols-2">
          <RadioCard leading name="invite-window" selected={access.type === 'permanent'} onSelect={() => set({ type: 'permanent' })} title="Permanent" description="Until removed by an admin" />
          <RadioCard leading name="invite-window" selected={access.type === 'temporary'} onSelect={() => set({ type: 'temporary' })} title="Temporary" description="Auto-expires on a set date" />
        </div>
        <div className="grid gap-3.5 min-[701px]:grid-cols-2">
          {access.type === 'temporary' && (
            <Field label="Access expires" htmlFor="invite-expires-on" required>
              <DateField id="invite-expires-on" clearable={false} iconEnd className="h-10 rounded-[10px]" min={today} value={access.expiresOn} onChange={(expiresOn) => set({ expiresOn })} />
            </Field>
          )}
          <Field label="Session timeout" htmlFor="invite-timeout">
            <SelectField id="invite-timeout" triggerClassName="h-10 rounded-[10px]" value={access.sessionTimeout} options={TIMEOUTS} onChange={(sessionTimeout) => set({ sessionTimeout })} />
          </Field>
        </div>
      </ModalSection>

      <ModalSection label="Network & devices">
        <ToggleRow size="md" label="Restrict to office & VPN IPs" title={title('Restrict to office & VPN IPs')} description="Sign-ins from other networks are blocked" checked={access.ipRestricted} onChange={(ipRestricted) => set({ ipRestricted })} />
        {access.ipRestricted && (
          <Field label="Allowed IP ranges" htmlFor="invite-ips" hint="CIDR, comma separated">
            <TextField compact id="invite-ips" label="" hideLabel placeholder="103.12.44.0/24, 10.0.0.0/16" value={access.allowedIps} onChange={(e) => set({ allowedIps: e.target.value })} />
          </Field>
        )}
        <ToggleRow size="md" label="Block data export from personal devices" title={title('Block data export from personal devices')} description="CSV/PDF export only on managed laptops" checked={access.blockExport} onChange={(blockExport) => set({ blockExport })} />
      </ModalSection>

      <ModalSection label="Sensitive data (UU PDP)">
        <div className="flex flex-col gap-2.5 rounded-xl bg-secondary-soft px-4 py-3.5 text-secondary">
          <span className="flex items-center gap-2 text-13 font-bold"><ShieldCheck size={16} />Health data stays masked by default</span>
          <span className="text-12 leading-normal font-medium">Unmasking requires a ticket reference and is logged. Weekly review by the Data Protection Officer.</span>
        </div>
        <div className="flex flex-col gap-2.5">
          <CheckRow checked={access.dpa} onChange={(dpa) => set({ dpa })} title={title('Invitee must sign the confidentiality & data-processing agreement before first login')} />
          <CheckRow checked={access.training} onChange={(training) => set({ training })} title={title('Complete “Handling health data” training (15 min) within 7 days')} />
        </div>
      </ModalSection>
    </>
  )
}
