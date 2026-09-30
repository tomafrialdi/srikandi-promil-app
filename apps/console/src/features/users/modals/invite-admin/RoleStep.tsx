import { Badge, Field, RadioCard, ToggleRow } from '../../../../shared/ui'
import type { RoleCatalog } from '../../types'
import { TICKET_QUEUES, type InviteForm } from './invite-form'
import { cn } from '../../../../shared/lib/cn'

interface StepProps {
  form: InviteForm
  update: (patch: Partial<InviteForm>) => void
  catalog: RoleCatalog | undefined
}

/** Roles whose custom overrides do not make sense (all-access or read-only). */
const NO_OVERRIDES = ['super_admin', 'analyst']

export function RoleStep({ form, update, catalog }: StepProps) {
  const roles = catalog?.roles ?? []
  const role = roles.find((r) => r.role === form.role)
  const canInviteSuper = catalog?.my_role === 'super_admin'
  const setOverride = (patch: Partial<InviteForm['overrides']>) => update({ overrides: { ...form.overrides, ...patch } })

  const toggleQueue = (queue: string) =>
    setOverride({
      queues: form.overrides.queues.includes(queue) ? form.overrides.queues.filter((q) => q !== queue) : [...form.overrides.queues, queue],
    })

  return (
    <>
      <section className="flex flex-col gap-3.5">
        <h3 className="text-11 font-bold tracking-[0.02em] text-ink-faint uppercase">Choose a role</h3>
        <div className="grid gap-2.5 min-[701px]:grid-cols-2">
          {roles.map((r) => (
            <RadioCard
              key={r.role}
              name="invite-role"
              selected={form.role === r.role}
              disabled={r.role === 'super_admin' && !canInviteSuper}
              onSelect={() => update({ role: r.role })}
              title={r.label}
              description={r.summary}
              badge={r.approvals > 0 ? <Badge tone="error">{`${r.approvals} approvals`}</Badge> : undefined}
            />
          ))}
        </div>
      </section>

      {role && (
        <section className="flex flex-col gap-3.5">
          <h3 className="text-11 font-bold tracking-[0.02em] text-ink-faint uppercase">What {role.label} can do</h3>
          <dl className="m-0 flex flex-col rounded-xl border border-border">
            {role.permissions.map((p) => (
              <div key={p.area} className="flex items-center justify-between border-b border-border px-3.5 py-2.5 text-13 last:border-b-0 [&_dt]:font-semibold [&_dd]:m-0 [&_dd]:font-bold [&_dd]:text-primary">
                <dt>{p.area}</dt>
                <dd className={p.level === 'None' ? 'text-ink-faint!' : undefined}>{p.level}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {role && !NO_OVERRIDES.includes(role.role) && (
        <section className="flex flex-col gap-3.5">
          <h3 className="text-11 font-bold tracking-[0.02em] text-ink-faint uppercase">Custom overrides</h3>
          <ToggleRow
            label="Issue refunds up to Rp 500.000"
            title="Issue refunds up to Rp 500.000"
            description="Larger refunds need an Admin"
            checked={form.overrides.refund}
            onChange={(refund) => setOverride({ refund })}
          />
          <ToggleRow
            label="Unmask health data with reason"
            title="Unmask health data with reason"
            description="Each unmask is logged & reviewed weekly"
            checked={form.overrides.unmask}
            onChange={(unmask) => setOverride({ unmask })}
          />
          <ToggleRow
            label="Edit engine results"
            title="Edit engine results (e.g. correct LH reading)"
            description="Logged in user audit trail"
            checked={form.overrides.engineEdit}
            onChange={(engineEdit) => setOverride({ engineEdit })}
          />
          <Field label="Ticket queues">
            <div className="flex flex-wrap gap-2">
              {TICKET_QUEUES.map((queue) => (
                <button
                  key={queue}
                  type="button"
                  aria-pressed={form.overrides.queues.includes(queue)}
                  className={cn('rounded-full border px-3 py-1.5 text-12 font-semibold', form.overrides.queues.includes(queue) ? 'border-primary bg-primary-soft text-primary' : 'border-border')}
                  onClick={() => toggleQueue(queue)}
                >
                  {queue}
                </button>
              ))}
            </div>
          </Field>
        </section>
      )}
    </>
  )
}
