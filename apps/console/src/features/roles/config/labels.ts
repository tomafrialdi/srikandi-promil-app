import { CheckCircle, Eye, EyeSlash, Minus, type Icon } from '@phosphor-icons/react'
import type { BadgeTone } from '../../../shared/ui'
import type { DeviceKind, Level, Severity } from '../types'

export const LEVEL: Record<Level, { label: string; icon: Icon; className: string }> = {
  full: { label: 'Full', icon: CheckCircle, className: 'text-success' },
  view: { label: 'View', icon: Eye, className: 'text-secondary' },
  masked: { label: 'Masked', icon: EyeSlash, className: 'text-warning-ink' },
  none: { label: 'None', icon: Minus, className: 'text-ink-faint' },
}

export const LEVEL_ORDER: Level[] = ['full', 'view', 'masked', 'none']

export const ROLE_TONE: Record<string, BadgeTone> = {
  super_admin: 'primary',
  admin: 'primary',
  medical_reviewer: 'info',
  engine_engineer: 'warning',
  content_editor: 'neutral',
  moderator: 'success',
  support_agent: 'neutral',
  analyst: 'neutral',
}

export const SEVERITY: Record<Severity, { label: string; tone: BadgeTone }> = {
  high: { label: 'High', tone: 'error' },
  medium: { label: 'Medium', tone: 'warning' },
  low: { label: 'Low', tone: 'info' },
}

export const DEVICE: Record<DeviceKind, { label: string }> = {
  managed_laptop: { label: 'Managed laptops' },
  admin_app: { label: 'Srikandi Admin app' },
  browser: { label: 'Unmanaged browsers' },
}

/** Audit dot colour by action prefix. Anything not listed is neutral. */
export const ACTION_DOT: Array<[prefix: string, color: string]> = [
  ['health.', 'var(--error)'],
  ['admin.', 'var(--error)'],
  ['security.', 'var(--error)'],
  ['user.unmask', 'var(--error)'],
  ['engine.override', 'var(--warning)'],
  ['engine.', 'var(--secondary)'],
  ['content.', 'var(--success)'],
  ['community.', 'var(--ink-muted)'],
]

/** Readable text for audit actions that were written without a summary. */
export const ACTION_LABEL: Record<string, string> = {
  'auth.sign_in': 'Signed in',
  'auth.password_change': 'Changed password',
  'account.profile_update': 'Updated profile',
  'account.token_create': 'Created API token',
  'account.token_revoke': 'Revoked API token',
  'account.session_revoke': 'Ended a session',
  'account.backup_codes_regenerate': 'Regenerated backup codes',
  'account.deactivation_request': 'Requested account deactivation',
  'admin.invite': 'Invited a team member',
  'audit.export': 'Exported the audit log',
  'security.request': 'Requested security policy change',
  'security.approve': 'Approved security policy change',
  'security.reject': 'Rejected security policy change',
  'security.cancel': 'Cancelled security policy request',
  'security.sign_out_all': 'Signed out all console sessions',
  'user.view': 'Viewed a user profile',
  'user.change_plan': 'Changed a user’s plan',
  'invoice.refund': 'Refunded an invoice',
  'community.keyword_add': 'Added a keyword rule',
  'community.keyword_delete': 'Deleted a keyword rule',
  'community.guidelines_update': 'Updated community guidelines',
  'community.group_create': 'Created a community group',
}

export function actionText(row: { action: string; summary: string | null }): string {
  return row.summary ?? ACTION_LABEL[row.action] ?? row.action
}

export function actionDot(action: string): string {
  return ACTION_DOT.find(([prefix]) => action.startsWith(prefix))?.[1] ?? 'var(--ink-faint)'
}
