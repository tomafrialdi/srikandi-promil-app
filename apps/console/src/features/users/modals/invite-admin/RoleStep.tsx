import { Eye, EyeSlash, CheckCircle, ChartLineUp, ChatsCircle, FileText, GearSix, GitBranch, Minus, SealCheck, ShieldCheck, Shield, Lifebuoy, type Icon } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Badge, ChipToggleGroup, Field, ModalSection, ToggleRow } from '../../../../shared/ui'
import { cn } from '../../../../shared/lib/cn'
import type { RoleCatalog } from '../../types'
import { TICKET_QUEUES, type InviteForm } from './invite-form'

interface StepProps {
  form: InviteForm
  update: (patch: Partial<InviteForm>) => void
  catalog: RoleCatalog | undefined
}

/** Roles whose custom overrides do not make sense (all-access or read-only). */
const NO_OVERRIDES = ['super_admin', 'analyst']

const ROLE_LOOK: Record<string, { icon: Icon; tint: string; ink: string }> = {
  super_admin: { icon: Shield, tint: 'var(--error-soft)', ink: 'var(--error)' },
  admin: { icon: GearSix, tint: 'var(--primary-soft)', ink: 'var(--primary)' },
  medical_reviewer: { icon: SealCheck, tint: 'var(--secondary-soft)', ink: 'var(--secondary)' },
  engine_engineer: { icon: GitBranch, tint: 'var(--warning-soft)', ink: 'var(--warning-ink)' },
  content_editor: { icon: FileText, tint: 'var(--surface-alt)', ink: 'var(--ink-muted)' },
  moderator: { icon: ChatsCircle, tint: 'var(--success-soft)', ink: 'var(--success)' },
  support_agent: { icon: Lifebuoy, tint: 'var(--secondary-soft)', ink: 'var(--secondary)' },
  analyst: { icon: ChartLineUp, tint: 'var(--surface-alt)', ink: 'var(--ink-muted)' },
}

const LEVEL: Record<string, { icon: Icon; ink: string }> = {
  full: { icon: CheckCircle, ink: 'var(--success)' },
  view: { icon: Eye, ink: 'var(--secondary)' },
  masked: { icon: EyeSlash, ink: 'var(--warning-ink)' },
  none: { icon: Minus, ink: 'var(--ink-faint)' },
}

export function RoleStep({ form, update, catalog }: StepProps) {
  const roles = catalog?.roles ?? []
  const role = roles.find((r) => r.role === form.role)
  const canInviteSuper = catalog?.my_role === 'super_admin'
  const setOverride = (patch: Partial<InviteForm['overrides']>) => update({ overrides: { ...form.overrides, ...patch } })

  return (
    <>
      <ModalSection label="Choose a role" action={<Link to="/roles" className="text-12 font-bold text-primary">Compare roles</Link>}>
        <div className="grid gap-2.5 min-[701px]:grid-cols-2">
          {roles.map((r) => {
            const look = ROLE_LOOK[r.role] ?? { icon: GearSix, tint: 'var(--surface-alt)', ink: 'var(--ink-muted)' }
            const Glyph = look.icon
            const selected = form.role === r.role
            const disabled = r.role === 'super_admin' && !canInviteSuper
            return (
              <label key={r.role} className={cn('relative flex items-center gap-3 rounded-xl border px-3.5 py-3', selected ? 'border-primary bg-primary-soft' : 'border-border bg-card', disabled ? 'cursor-not-allowed opacity-55' : 'cursor-pointer')}>
                <input type="radio" className="peer absolute inset-0 m-0 cursor-[inherit] opacity-0" name="invite-role" checked={selected} disabled={disabled} onChange={() => update({ role: r.role })} />
                <span className="inline-flex size-[34px] flex-none items-center justify-center rounded-[10px]" style={{ background: selected ? 'var(--card)' : look.tint, color: look.ink }}>
                  <Glyph size={16} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-px">
                  <span className="flex items-center gap-2 text-13 font-bold">{r.label}{r.approvals > 0 && <Badge tone="error">{`${r.approvals} approvals`}</Badge>}</span>
                  <span className="truncate text-11 font-medium text-ink-muted">{r.summary}</span>
                </span>
                <span className={cn('size-[18px] flex-none rounded-full bg-card peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary', selected ? 'border-[5px] border-primary' : 'border-[1.5px] border-border')} aria-hidden="true" />
              </label>
            )
          })}
        </div>
      </ModalSection>

      {role && (
        <ModalSection label={`What ${role.label} can do`}>
          <dl className="m-0 flex flex-col overflow-hidden rounded-xl border border-border">
            {role.permissions.map((p, i) => {
              const look = LEVEL[p.level.toLowerCase()] ?? { icon: ShieldCheck, ink: 'var(--secondary)' }
              const Glyph = look.icon
              return (
                <div key={p.area} className={cn('flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0', i % 2 === 1 && 'bg-surface')}>
                  <dt className="min-w-0 flex-1 text-13 font-semibold">{p.area}</dt>
                  <dd className="m-0 flex w-20 items-center gap-1.5 text-12 font-bold" style={{ color: look.ink }}>
                    <Glyph size={15} />
                    {p.level}
                  </dd>
                </div>
              )
            })}
          </dl>
        </ModalSection>
      )}

      {role && !NO_OVERRIDES.includes(role.role) && (
        <ModalSection label="Custom overrides">
          <ToggleRow size="md" label="Issue refunds up to Rp 500.000" title={<span className="font-semibold">Issue refunds up to Rp 500.000</span>} description="Larger refunds need an Admin" checked={form.overrides.refund} onChange={(refund) => setOverride({ refund })} />
          <ToggleRow size="md" label="Unmask health data with reason" title={<span className="font-semibold">Unmask health data with reason</span>} description="Each unmask is logged & reviewed weekly" checked={form.overrides.unmask} onChange={(unmask) => setOverride({ unmask })} />
          <ToggleRow size="md" label="Edit engine results" title={<span className="font-semibold">Edit engine results (e.g. correct LH reading)</span>} description="Logged in user audit trail" checked={form.overrides.engineEdit} onChange={(engineEdit) => setOverride({ engineEdit })} />
          <Field label="Ticket queues">
            <ChipToggleGroup label="Ticket queues" options={TICKET_QUEUES} selected={form.overrides.queues} onChange={(queues) => setOverride({ queues })} />
          </Field>
        </ModalSection>
      )}
    </>
  )
}
