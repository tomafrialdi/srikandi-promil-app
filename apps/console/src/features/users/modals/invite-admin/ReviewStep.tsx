import { useState } from 'react'
import { Badge, ModalSection, Notice } from '../../../../shared/ui'
import { initials } from '../../../../shared/lib/format'
import { CheckCircle, Lifebuoy, Lock, PencilSimple, Warning } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
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
  const senderFirst = (senderName.split(/[._-]/)[0] ?? senderName).replace(/^./, (c) => c.toUpperCase())
  const showOverrides = role && !['super_admin', 'analyst'].includes(role.role)
  const healthLevel = level(role, 'Health data')

  const roleRows: Array<[string, ReactNode]> = [
    ['Role', <Badge key="r" tone="info">{role?.label ?? '—'}</Badge>],
    ['Health data', <Badge key="h" tone={healthLevel === 'Masked' ? 'warning' : healthLevel === 'None' ? 'neutral' : 'info'}>{healthLevel}</Badge>],
    ['Refunds', showOverrides && form.overrides.refund ? '≤ Rp 500.000' : level(role, 'Billing & refunds')],
    ['Engine corrections', showOverrides && form.overrides.engineEdit ? 'Allowed' : 'Not allowed'],
    ...(showOverrides && form.overrides.queues.length > 0 ? ([['Queues', form.overrides.queues.join(' · ')]] as Array<[string, ReactNode]>) : []),
  ]
  const agreements = [form.access.dpa && 'DPA', form.access.training && 'training'].filter(Boolean).join(' + ')
  const accessRows: Array<[string, ReactNode]> = [
    ['2FA', <Badge key="t" tone="success">Required</Badge>],
    ['SSO', form.access.sso ? 'Google Workspace' : 'Off'],
    ['Access until', form.access.type === 'temporary' && form.access.expiresOn ? dateFormat.format(new Date(form.access.expiresOn)) : 'Permanent'],
    ['IP restriction', form.access.ipRestricted ? 'Office + VPN' : 'None'],
    ['Agreements', agreements ? <Badge key="a" tone="success">{agreements}</Badge> : 'None'],
  ]

  return (
    <>
      <ModalSection
        label="Invitees"
        action={<button type="button" className="inline-flex items-center gap-1 text-12 font-bold text-primary" onClick={() => onEdit(0)}><PencilSimple size={12} weight="bold" />Edit</button>}
      >
        <div className="flex flex-col gap-2">
          {emails.map((email) => {
            const name = displayName(form, email, emails.length)
            return (
              <div key={email} className="flex items-center gap-3 rounded-xl bg-surface px-3.5 py-3">
                <span className="inline-flex size-9 flex-none items-center justify-center rounded-full bg-secondary-soft text-14 font-bold text-secondary" aria-hidden="true">{initials(name)[0] ?? ''}</span>
                <span className="flex min-w-0 flex-1 flex-col gap-px">
                  <strong className="text-13 font-bold">{name}</strong>
                  <span className="truncate text-12 font-medium text-ink-muted">{email}</span>
                </span>
                <Badge tone="neutral">{form.department}</Badge>
              </div>
            )
          })}
        </div>
        {skipped > 0 && (
          <Notice tone="warning" icon={<Warning size={16} />}>
            {skipped} address{skipped === 1 ? '' : 'es'} outside allowed domains will be skipped.
          </Notice>
        )}
      </ModalSection>

      <div className="grid gap-3.5 min-[701px]:grid-cols-2">
        <SummaryCard icon={<Lifebuoy size={15} className="text-primary" />} title="Role" rows={roleRows} onEdit={() => onEdit(1)} />
        <SummaryCard icon={<Lock size={15} className="text-primary" />} title="Access" rows={accessRows} onEdit={() => onEdit(2)} />
      </div>

      <ModalSection label="Email preview">
        <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-14 font-extrabold text-primary">Srikandi Promil</span>
            <span className="text-11 font-medium text-ink-faint">from: admin@srikandipromil.id</span>
          </div>
          <strong className="text-15 font-extrabold">{senderFirst} invited you to the Srikandi Promil admin console</strong>
          <p className="m-0 text-12 leading-normal font-medium whitespace-pre-wrap text-ink-muted">{form.message.trim() || 'You have been invited to join the Srikandi Promil admin console.'}</p>
          <span className="self-start rounded-[10px] bg-primary px-4 py-2 text-12 font-bold text-white">Accept invitation</span>
          <span className="text-11 font-medium text-ink-faint">This link expires in {form.expiresDays} days ({dateFormat.format(expires)}).</span>
        </div>
      </ModalSection>

      {role && (
        <Notice tone={role.approvals > 0 ? 'warning' : 'success'} icon={role.approvals > 0 ? <Warning size={16} /> : <CheckCircle size={16} weight="fill" />}>
          {role.approvals > 0
            ? `${role.label} invites need ${role.approvals} approvals before they are sent.`
            : `No second approval needed for ${role.label}. Super admin invites require 2 approvers.`}
        </Notice>
      )}
    </>
  )
}

function SummaryCard({ icon, title, rows, onEdit }: { icon: ReactNode; title: string; rows: Array<[string, ReactNode]>; onEdit: () => void }) {
  return (
    <section className="flex flex-col gap-2.5 rounded-xl border border-border p-3.5">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-13 font-bold">{icon}{title}</h3>
        <button type="button" className="text-12 font-bold text-primary" onClick={onEdit}>Edit</button>
      </div>
      <dl className="m-0 flex flex-col gap-2.5">
        {rows.map(([label, value]) => (
          <div key={label} className="flex min-h-5 items-center justify-between gap-3 text-12">
            <dt className="font-medium text-ink-muted">{label}</dt>
            <dd className="m-0 text-right font-bold">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
