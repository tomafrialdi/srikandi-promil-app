import { Field, SelectField, TextAreaField, TextField, ChipInput, Button } from '../../../../shared/ui'
import type { RoleCatalog } from '../../types'
import { validateEmail, type InviteForm } from './invite-form'
import styles from './InviteAdmin.module.css'

interface StepProps {
  form: InviteForm
  update: (patch: Partial<InviteForm>) => void
  catalog: RoleCatalog | undefined
}

const EXPIRY = [
  { value: '3', label: 'In 3 days' },
  { value: '7', label: 'In 7 days' },
  { value: '14', label: 'In 14 days' },
]

export function DetailsStep({ form, update, catalog }: StepProps) {
  const domains = catalog?.allowed_domains ?? []
  const firstError = form.emails.map((email) => validateEmail(email, domains)).find(Boolean) ?? null
  const role = catalog?.roles.find((r) => r.role === form.role)

  return (
    <>
      <section className={styles.group}>
        <h3 className={styles.groupLabel}>Who are you inviting?</h3>
        <Field label="Work email(s)" htmlFor="invite-emails" required hint="Separate with comma or Enter" error={firstError}>
          <ChipInput
            id="invite-emails"
            values={form.emails}
            onChange={(emails) => update({ emails })}
            validate={(email) => validateEmail(email, domains)}
            placeholder="name@srikandipromil.id"
          />
        </Field>
        <div className={styles.grid2}>
          <Field label="Full name (optional)" htmlFor="invite-name">
            <TextField
              id="invite-name"
              label=""
              placeholder="Filled from email if left empty"
              value={form.fullName}
              onChange={(e) => update({ fullName: e.target.value })}
              hideLabel
            />
          </Field>
          <Field label="Job title" htmlFor="invite-title">
            <TextField
              id="invite-title"
              label=""
              placeholder="e.g. Support agent · Midwife"
              value={form.jobTitle}
              onChange={(e) => update({ jobTitle: e.target.value })}
              hideLabel
            />
          </Field>
          <Field label="Department" htmlFor="invite-department" required>
            <SelectField
              id="invite-department"
              value={form.department}
              options={[{ value: '', label: 'Select a department' }, ...(catalog?.departments ?? []).map((d) => ({ value: d, label: d }))]}
              onChange={(department) => update({ department })}
            />
          </Field>
          <Field label="Reports to" htmlFor="invite-reports">
            <SelectField
              id="invite-reports"
              value={form.reportsTo}
              options={[{ value: '', label: 'Nobody' }, ...(catalog?.team ?? []).map((t) => ({ value: t.id, label: t.name }))]}
              onChange={(reportsTo) => update({ reportsTo })}
            />
          </Field>
          <Field label="Console language" htmlFor="invite-language">
            <SelectField
              id="invite-language"
              value={form.language}
              options={[{ value: 'English', label: 'English' }, { value: 'Bahasa Indonesia', label: 'Bahasa Indonesia' }]}
              onChange={(language) => update({ language })}
            />
          </Field>
        </div>
      </section>

      <section className={styles.group}>
        <h3 className={styles.groupLabel}>Invitation</h3>
        <Field label="Personal message" htmlFor="invite-message" hint="Included in the email">
          <TextAreaField
            id="invite-message"
            placeholder="Hi! Welcome to the care team…"
            value={form.message}
            onChange={(e) => update({ message: e.target.value })}
          />
        </Field>
        <div className={styles.grid2}>
          <Field label="Invite link expires" htmlFor="invite-expiry">
            <SelectField id="invite-expiry" value={form.expiresDays} options={EXPIRY} onChange={(expiresDays) => update({ expiresDays })} />
          </Field>
          <Field label="Onboarding checklist">
            <span className={styles.readonly}>{role ? `${role.label} · 5 steps` : '—'}</span>
          </Field>
        </div>
      </section>

      <div className={styles.bulk}>
        <span>Inviting a whole team? Upload a CSV with email, name, role and department.</span>
        <Button variant="outline" disabled title="CSV upload is not available yet">
          Upload CSV
        </Button>
      </div>
    </>
  )
}
