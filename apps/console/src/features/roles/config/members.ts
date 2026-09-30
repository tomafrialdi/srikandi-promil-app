import { Fingerprint, DeviceMobile, WarningCircle, type Icon } from '@phosphor-icons/react'
import type { BadgeTone } from '../../../shared/ui'
import type { MemberStatus, MemberTfa } from '../types'

export const MEMBERS_PAGE_SIZE = 10

export const MEMBER_STATUS: Record<MemberStatus, { label: string; tone: BadgeTone; dot: string }> = {
  active: { label: 'Active', tone: 'success', dot: 'var(--success)' },
  suspended: { label: 'Suspended', tone: 'error', dot: 'var(--error)' },
}

export const TFA: Record<MemberTfa, { label: string; icon: Icon; className: string }> = {
  passkey: { label: 'Passkey', icon: Fingerprint, className: 'text-success' },
  authenticator: { label: 'Authenticator', icon: DeviceMobile, className: 'text-secondary' },
  none: { label: 'Not set up', icon: WarningCircle, className: 'text-error' },
}

export const TFA_FILTER_OPTIONS = [
  { value: '', label: '2FA: All' },
  { value: 'passkey', label: 'Passkey' },
  { value: 'authenticator', label: 'Authenticator' },
  { value: 'none', label: 'Not set up' },
]
