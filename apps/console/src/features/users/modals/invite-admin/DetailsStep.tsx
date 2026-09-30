import { FileXls } from '@phosphor-icons/react'
import { Button, ChipInput, Field, ModalSection, SelectField, TextAreaField, TextField } from '../../../../shared/ui'
import type { RoleCatalog } from '../../types'
import { validateEmail, type InviteForm } from './invite-form'

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

const SELECT = 'h-10 rounded-[10px]'

export function DetailsStep({ form, update, catalog }: StepProps) {
  const domains = catalog?.allowed_domains ?? []
  const firstError = form.emails.map((email) => validateEmail(email, domains)).find(Boolean) ?? null
  const role = catalog?.roles.find((r) => r.role === form.role)

  return (
    <>
      <ModalSection label="Who are you inviting?">
        <Field label="Work email(s)" htmlFor="invite-emails" required hint="Separate with comma or Enter" error={firstError}>
          <ChipInput
            id="invite-emails"
            values={form.emails}
            onChange={(emails) => update({ emails })}
            validate={(email) => validateEmail(email, domains)}
            placeholder="name@srikandipromil.id"
          />
        </Field>
        <div className="grid gap-3.5 min-[701px]:grid-cols-2">
          <Field label="Full name (optional)" htmlFor="invite-name">
            <TextField compact id="invite-name" label="" placeholder="Filled from email if left empty" value={form.fullName} onChange={(e) => update({ fullName: e.target.value })} hideLabel />
          </Field>
          <Field label="Job title" htmlFor="invite-title">
            <TextField compact id="invite-title" label="" placeholder="e.g. Support agent · Midwife" value={form.jobTitle} onChange={(e) => update({ jobTitle: e.target.value })} hideLabel />
          </Field>
        </div>
        <div className="grid gap-3.5 min-[701px]:grid-cols-3">
          <Field label="Department" htmlFor="invite-department" required>
            <SelectField
              id="invite-department"
              triggerClassName={SELECT}
              value={form.department}
              options={[{ value: '', label: 'Select a department' }, ...(catalog?.departments ?? []).map((d) => ({ value: d, label: d }))]}
              onChange={(department) => update({ department })}
            />
          </Field>
          <Field label="Reports to" htmlFor="invite-reports">
            <SelectField
              id="invite-reports"
              triggerClassName={SELECT}
              value={form.reportsTo}
              options={[{ value: '', label: 'Nobody' }, ...(catalog?.team ?? []).map((t) => ({ value: t.id, label: t.name }))]}
              onChange={(reportsTo) => update({ reportsTo })}
            />
          </Field>
          <Field label="Console language" htmlFor="invite-language">
            <SelectField
              id="invite-language"
              triggerClassName={SELECT}
              value={form.language}
              options={[{ value: 'English', label: 'English' }, { value: 'Bahasa Indonesia', label: 'Bahasa Indonesia' }]}
              onChange={(language) => update({ language })}
            />
          </Field>
        </div>
      </ModalSection>

      <ModalSection label="Invitation">
        <Field label="Personal message" htmlFor="invite-message" hint="Included in the email">
          <TextAreaField id="invite-message" className="min-h-[72px] rounded-[10px] text-13 font-semibold" placeholder="Hi! Welcome to the care team…" value={form.message} onChange={(e) => update({ message: e.target.value })} />
        </Field>
        <div className="grid gap-3.5 min-[701px]:grid-cols-2">
          <Field label="Invite link expires" htmlFor="invite-expiry">
            <SelectField id="invite-expiry" triggerClassName={SELECT} value={form.expiresDays} options={EXPIRY} onChange={(expiresDays) => update({ expiresDays })} />
          </Field>
          <Field label="Onboarding checklist" htmlFor="invite-checklist">
            <SelectField id="invite-checklist" triggerClassName={SELECT} value="role" options={[{ value: 'role', label: role ? `${role.label} · 5 steps` : '—' }]} onChange={() => undefined} />
          </Field>
        </div>
      </ModalSection>

      <div className="flex items-center gap-3 rounded-xl bg-secondary-soft px-4 py-3.5 text-12 font-semibold text-secondary">
        <FileXls size={18} className="flex-none" />
        <span className="min-w-0 flex-1">Inviting a whole team? Upload a CSV with email, name, role and department.</span>
        <Button variant="outline" className="!rounded-lg !bg-card !px-3 !py-1.5 text-12 !text-secondary" disabled title="CSV upload is not available yet">
          Upload CSV
        </Button>
      </div>
    </>
  )
}
