import type { AllowedRange, SecurityData, SecurityDraft, SecurityPolicy } from '../../types'

export function toDraft(data: SecurityData): SecurityDraft {
  return {
    policy: structuredClone(data.policy),
    ip_allowlist: data.ip_allowlist.map(({ cidr, label, expires_on }): AllowedRange => ({ cidr, label, expires_on })),
    alert_rules: Object.fromEntries(data.alert_rules.map((rule) => [rule.key, rule.enabled])),
  }
}

export const isDirty = (a: SecurityDraft, b: SecurityDraft) => JSON.stringify(a) !== JSON.stringify(b)

/** Props every tab gets for one policy section. */
export interface SectionProps<S extends keyof SecurityPolicy> {
  value: SecurityPolicy[S]
  onChange: (patch: Partial<SecurityPolicy[S]>) => void
}

export const FOOTER_HINT = {
  authentication: null,
  sessions: 'Changes apply at next sign-in',
  network: null,
  data: 'Changes here also need DPO approval',
  alerts: 'Alerts also appear in Audit log → Alerts',
} as const
