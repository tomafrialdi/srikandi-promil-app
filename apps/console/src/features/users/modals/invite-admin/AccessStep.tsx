import { useState } from 'react'
import { Field, RadioCard, SelectField, TextField, ToggleRow, CheckRow } from '../../../../shared/ui'
import type { InviteForm } from './invite-form'
import styles from './InviteAdmin.module.css'

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

export function AccessStep({ form, update }: StepProps) {
  const access = form.access
  const set = (patch: Partial<InviteForm['access']>) => update({ access: { ...access, ...patch } })
  const [today] = useState(() => new Date().toISOString().slice(0, 10))

  return (
    <>
      <section className={styles.group}>
        <h3 className={styles.groupLabel}>Sign-in</h3>
        <ToggleRow
          label="Two-factor authentication"
          title="Two-factor authentication"
          description="Required for every admin (authenticator app or passkey)"
          checked
          disabled
          onChange={() => undefined}
        />
        <ToggleRow
          label="Sign in with Google Workspace (SSO)"
          title="Sign in with Google Workspace (SSO)"
          description="Only @srikandipromil.id accounts"
          checked={access.sso}
          onChange={(sso) => set({ sso })}
        />
        <ToggleRow
          label="Allow passkeys"
          title="Allow passkeys"
          description="Face ID / Touch ID / Windows Hello"
          checked={access.passkeys}
          onChange={(passkeys) => set({ passkeys })}
        />
      </section>

      <section className={styles.group}>
        <h3 className={styles.groupLabel}>Access window</h3>
        <div className={styles.grid2}>
          <RadioCard
            name="invite-window"
            selected={access.type === 'permanent'}
            onSelect={() => set({ type: 'permanent' })}
            title="Permanent"
            description="Until removed by an admin"
          />
          <RadioCard
            name="invite-window"
            selected={access.type === 'temporary'}
            onSelect={() => set({ type: 'temporary' })}
            title="Temporary"
            description="Auto-expires on a set date"
          />
          {access.type === 'temporary' && (
            <Field label="Access expires" htmlFor="invite-expires-on" required>
              <input
                id="invite-expires-on"
                type="date"
                min={today}
                className={styles.dateInput}
                value={access.expiresOn}
                onChange={(e) => set({ expiresOn: e.target.value })}
              />
            </Field>
          )}
          <Field label="Session timeout" htmlFor="invite-timeout">
            <SelectField id="invite-timeout" value={access.sessionTimeout} options={TIMEOUTS} onChange={(sessionTimeout) => set({ sessionTimeout })} />
          </Field>
        </div>
      </section>

      <section className={styles.group}>
        <h3 className={styles.groupLabel}>Network & devices</h3>
        <ToggleRow
          label="Restrict to office & VPN IPs"
          title="Restrict to office & VPN IPs"
          description="Sign-ins from other networks are blocked"
          checked={access.ipRestricted}
          onChange={(ipRestricted) => set({ ipRestricted })}
        />
        {access.ipRestricted && (
          <Field label="Allowed IP ranges" htmlFor="invite-ips" hint="CIDR, comma separated">
            <TextField
              id="invite-ips"
              label=""
              hideLabel
              placeholder="103.12.44.0/24, 10.0.0.0/16"
              value={access.allowedIps}
              onChange={(e) => set({ allowedIps: e.target.value })}
            />
          </Field>
        )}
        <ToggleRow
          label="Block data export from personal devices"
          title="Block data export from personal devices"
          description="CSV/PDF export only on managed laptops"
          checked={access.blockExport}
          onChange={(blockExport) => set({ blockExport })}
        />
      </section>

      <section className={styles.group}>
        <h3 className={styles.groupLabel}>Sensitive data (UU PDP)</h3>
        <div className={styles.notice}>
          <strong>Health data stays masked by default</strong>
          <span>Unmasking requires a ticket reference and is logged. Weekly review by the Data Protection Officer.</span>
        </div>
        <CheckRow
          checked={access.dpa}
          onChange={(dpa) => set({ dpa })}
          title="Invitee must sign the confidentiality & data-processing agreement before first login"
        />
        <CheckRow
          checked={access.training}
          onChange={(training) => set({ training })}
          title="Complete “Handling health data” training (15 min) within 7 days"
        />
      </section>
    </>
  )
}
