import { useState } from 'react'
import { Avatar, Badge, Notice } from '../../../../shared/ui'
import { initials } from '../../../../shared/lib/format'
import { CheckCircle, Warning } from '@phosphor-icons/react'
import type { RoleCatalog } from '../../types'
import { displayName, validEmails, type InviteForm } from './invite-form'

interface ReviewStepProps {
  form: InviteForm
  catalog: RoleCatalog | undefined
  onEdit: (step: number) => void
  senderEmail: string
}

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

function level(role: RoleCatalog['roles'][number] | undefined, area: string) {
  return role?.permissions.find((p) => p.area === area)?.level ?? '—'
}

export function ReviewStep({ form, catalog, onEdit, senderEmail }: ReviewStepProps) {
  const emails = validEmails(form, catalog)
  const skipped = form.emails.length - emails.length
  const role = catalog?.roles.find((r) => r.role === form.role)
  const [now] = useState(() => Date.now())
  const expires = new Date(now + Number(form.expiresDays) * 86_400_000)
  const senderName = senderEmail.split('@')[0] ?? 'An admin'
  const showOverrides = role && !['super_admin', 'analyst'].includes(role.role)

  const roleRows: Array<[string, string]> = [
    ['Role', role?.label ?? '—'],
    ['Health data', level(role, 'Health data')],
    ['Refunds', showOverrides && form.overrides.refund ? '≤ Rp 500.000' : level(role, 'Billing & refunds')],
    ['Engine corrections', showOverrides && form.overrides.engineEdit ? 'Allowed' : 'Not allowed'],
    ...(showOverrides && form.overrides.queues.length > 0 ? ([['Queues', form.overrides.queues.join(' · ')]] as Array<[string, string]>) : []),
  ]
  const accessRows: Array<[string, string]> = [
    ['2FA', 'Required'],
    ['SSO', form.access.sso ? 'Google Workspace' : 'Off'],
    ['Access until', form.access.type === 'temporary' && form.access.expiresOn ? dateFormat.format(new Date(form.access.expiresOn)) : 'Permanent'],
    ['IP restriction', form.access.ipRestricted ? 'Office + VPN' : 'None'],
    ['Agreements', [form.access.dpa && 'DPA', form.access.training && 'training'].filter(Boolean).join(' + ') || 'None'],
  ]

  return (
    <>
      <section className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-11 font-bold tracking-[0.02em] text-ink-faint uppercase">Invitees</h3>
          <button type="button" className="text-12 font-bold text-primary" onClick={() => onEdit(0)}>Edit</button>
        </div>
        {emails.map((email) => {
          const name = displayName(form, email, emails.length)
          return (
            <div key={email} className="flex items-center gap-3">
              <Avatar label={initials(name)[0] ?? ''} size={34} />
              <span className="flex min-w-0 flex-1 flex-col text-12 text-ink-muted [&_strong]:text-13 [&_strong]:text-ink">
                <strong>{name}</strong>
                <span>{email}</span>
              </span>
              <Badge tone="neutral">{form.department}</Badge>
            </div>
          )
        })}
        {skipped > 0 && (
          <Notice tone="warning" icon={<Warning size={16} />}>
            {skipped} address{skipped === 1 ? '' : 'es'} outside allowed domains will be skipped.
          </Notice>
        )}
      </section>

      <div className="grid gap-3.5 min-[701px]:grid-cols-2">
        <SummaryCard title="Role" rows={roleRows} onEdit={() => onEdit(1)} />
        <SummaryCard title="Access" rows={accessRows} onEdit={() => onEdit(2)} />
      </div>

      <section className="flex flex-col gap-3.5">
        <h3 className="text-11 font-bold tracking-[0.02em] text-ink-faint uppercase">Email preview</h3>
        <div className="flex flex-col gap-2 rounded-xl border border-dashed border-border bg-surface p-3.5">
          <span className="text-11 text-ink-faint">from: admin@srikandipromil.id</span>
          <strong className="text-14">{senderName} invited you to the Srikandi Promil admin console</strong>
          <p className="text-12 leading-normal whitespace-pre-wrap">{form.message.trim() || 'You have been invited to join the Srikandi Promil admin console.'}</p>
          <span className="self-start rounded-lg bg-primary px-3.5 py-2 text-12 font-bold text-white">Accept invitation</span>
          <span className="text-11 text-ink-muted">This link expires in {form.expiresDays} days ({dateFormat.format(expires)}).</span>
        </div>
      </section>

      {role && (
        <Notice tone={role.approvals > 0 ? 'warning' : 'neutral'} icon={role.approvals > 0 ? <Warning size={16} /> : <CheckCircle size={16} />}>
          {role.approvals > 0
            ? `${role.label} invites need ${role.approvals} approvals before they are sent.`
            : `No second approval needed for ${role.label}. Super admin invites require 2 approvers.`}
        </Notice>
      )}
    </>
  )
}

function SummaryCard({ title, rows, onEdit }: { title: string; rows: Array<[string, string]>; onEdit: () => void }) {
  return (
    <section className="rounded-xl border border-border p-3.5 [&_dl]:mt-2.5 [&_dl]:mb-0">
      <div className="flex items-center justify-between">
        <h3 className="text-13 font-extrabold">{title}</h3>
        <button type="button" className="text-12 font-bold text-primary" onClick={onEdit}>Edit</button>
      </div>
      <dl>
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 py-[5px] text-12 [&_dt]:text-ink-muted [&_dd]:m-0 [&_dd]:text-right [&_dd]:font-bold">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
