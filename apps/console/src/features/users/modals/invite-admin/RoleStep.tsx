import { Badge, Field, RadioCard, ToggleRow } from '../../../../shared/ui'
import type { RoleCatalog } from '../../types'
import { TICKET_QUEUES, type InviteForm } from './invite-form'
import styles from './InviteAdmin.module.css'

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
      <section className={styles.group}>
        <h3 className={styles.groupLabel}>Choose a role</h3>
        <div className={styles.roleGrid}>
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
        <section className={styles.group}>
          <h3 className={styles.groupLabel}>What {role.label} can do</h3>
          <dl className={styles.permissions}>
            {role.permissions.map((p) => (
              <div key={p.area} className={styles.permissionRow}>
                <dt>{p.area}</dt>
                <dd className={p.level === 'None' ? styles.none : undefined}>{p.level}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {role && !NO_OVERRIDES.includes(role.role) && (
        <section className={styles.group}>
          <h3 className={styles.groupLabel}>Custom overrides</h3>
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
            <div className={styles.chips}>
              {TICKET_QUEUES.map((queue) => (
                <button
                  key={queue}
                  type="button"
                  aria-pressed={form.overrides.queues.includes(queue)}
                  className={`${styles.queue} ${form.overrides.queues.includes(queue) ? styles.queueOn : ''}`}
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
