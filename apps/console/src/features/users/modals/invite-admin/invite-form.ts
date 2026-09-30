import type { RoleCatalog } from '../../types'

export interface InviteForm {
  emails: string[]
  fullName: string
  jobTitle: string
  department: string
  reportsTo: string
  language: string
  message: string
  expiresDays: string
  role: string
  overrides: { refund: boolean; unmask: boolean; engineEdit: boolean; queues: string[] }
  access: {
    sso: boolean
    passkeys: boolean
    type: 'permanent' | 'temporary'
    expiresOn: string
    sessionTimeout: string
    ipRestricted: boolean
    allowedIps: string
    blockExport: boolean
    dpa: boolean
    training: boolean
  }
}

export const TICKET_QUEUES = ['App bugs', 'Billing', 'Privacy / PDP', 'Midwife chat', 'Clinics']

export const INITIAL_FORM: InviteForm = {
  emails: [],
  fullName: '',
  jobTitle: '',
  department: '',
  reportsTo: '',
  language: 'English',
  message: '',
  expiresDays: '7',
  role: 'support_agent',
  overrides: { refund: true, unmask: false, engineEdit: true, queues: ['App bugs', 'Billing', 'Midwife chat'] },
  access: {
    sso: true,
    passkeys: true,
    type: 'permanent',
    expiresOn: '',
    sessionTimeout: '30',
    ipRestricted: false,
    allowedIps: '',
    blockExport: true,
    dpa: true,
    training: true,
  },
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/** null when the address is acceptable. */
export function validateEmail(email: string, allowedDomains: string[]): string | null {
  if (!EMAIL.test(email)) return `${email} is not a valid email address.`
  const domain = email.split('@')[1]?.toLowerCase() ?? ''
  if (!allowedDomains.includes(domain)) {
    return `${email} is outside allowed domains (${allowedDomains.join(', ')}).`
  }
  return null
}

export function validEmails(form: InviteForm, catalog: RoleCatalog | undefined): string[] {
  const domains = catalog?.allowed_domains ?? []
  return form.emails.filter((email) => validateEmail(email, domains) === null)
}

/** dewi.anggraini@x → "Dewi Anggraini" */
export function nameFromEmail(email: string): string {
  return (email.split('@')[0] ?? '')
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join(' ')
}

export function displayName(form: InviteForm, email: string, count: number): string {
  return count === 1 && form.fullName.trim() ? form.fullName.trim() : nameFromEmail(email)
}

export function buildPayload(form: InviteForm, catalog: RoleCatalog | undefined) {
  const emails = validEmails(form, catalog)
  return {
    invitees: emails.map((email) => ({ email, full_name: displayName(form, email, emails.length) })),
    job_title: form.jobTitle,
    department: form.department,
    reports_to: form.reportsTo || null,
    language: form.language,
    role: form.role,
    message: form.message,
    expires_days: Number(form.expiresDays),
    overrides: {
      refund_limit_idr: form.overrides.refund ? 500000 : 0,
      unmask_with_reason: form.overrides.unmask,
      edit_engine_results: form.overrides.engineEdit,
      ticket_queues: form.overrides.queues,
    },
    access: {
      sso: form.access.sso,
      passkeys: form.access.passkeys,
      access_type: form.access.type,
      access_expires_on: form.access.type === 'temporary' ? form.access.expiresOn : null,
      session_timeout_minutes: Number(form.access.sessionTimeout),
      ip_restricted: form.access.ipRestricted,
      allowed_ips: form.access.ipRestricted ? form.access.allowedIps : null,
      block_personal_export: form.access.blockExport,
      require_dpa: form.access.dpa,
      require_training: form.access.training,
    },
  }
}
