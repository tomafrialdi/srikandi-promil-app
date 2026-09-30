export type Level = 'full' | 'view' | 'masked' | 'none'

export interface MatrixRole {
  role: string
  label: string
  summary: string
  members: number
  levels: Level[]
}

export interface TeamMember {
  id: string
  name: string
  role: string
  role_label: string
  last_seen: string | null
  online: boolean
}

export interface AuditRow {
  id: number
  at: string
  actor: string | null
  action: string
  summary: string | null
  resource: string | null
  ip: string | null
}

export interface RolesOverview {
  my_role: string
  can_invite: boolean
  can_edit_security: boolean
  columns: { key: string; label: string }[]
  roles: MatrixRole[]
  total_members: number
  team: TeamMember[]
  audit: AuditRow[]
}

export type AuditExportRow = Omit<AuditRow, 'id'>

export interface SecurityPolicy {
  authentication: {
    sso: boolean
    require_2fa: boolean
    passkeys: boolean
    sms_fallback: boolean
    min_length: number
    rotation_days: number
    history: number
    block_breached: boolean
  }
  sessions: {
    idle_minutes: number
    absolute_hours: number
    max_concurrent: number
    signout_on_role_change: boolean
    trust_device: boolean
    managed_export_only: boolean
    block_mobile_browsers: boolean
  }
  network: {
    ip_restricted: boolean
    indonesia_only: boolean
    failed_logins: number
    lock_minutes: number
    autoblock_per_hour: number
  }
  data: {
    mask_default: boolean
    pseudonymise_exports: boolean
    watermark_exports: boolean
    export_approval: boolean
    export_approval_rows: number
    deleted_purge_days: number
    audit_years: number
    attachments_days: number
    dpo_name: string
  }
  alerts: {
    auto_lock_high: boolean
    reauth_medium: boolean
    channels: { slack: string; oncall: string }
  }
}

export interface AllowedRange {
  cidr: string
  label: string
  expires_on: string | null
  last_used_at?: string | null
}

export type Severity = 'high' | 'medium' | 'low'

export interface AlertRule {
  key: string
  label: string
  description: string
  severity: Severity
  enabled: boolean
}

export type DeviceKind = 'managed_laptop' | 'admin_app' | 'browser'

export interface SecurityData {
  policy: SecurityPolicy
  score: number
  ip_allowlist: AllowedRange[]
  alert_rules: AlertRule[]
  my_ip: string | null
  can_edit: boolean
  last_changed: { at: string; by: string } | null
  pending: { id: string; created_at: string; changes: string[]; requested_by: string; mine: boolean } | null
  stats: { members: number; tfa: number; passkeys: number; stale_passwords: number }
  sessions: { active: number; members: number }
  devices: { kind: DeviceKind; active: number }[]
  super_admins: number
}

/** What the modal edits and what admin_security_request receives. */
export interface SecurityDraft {
  policy: SecurityPolicy
  ip_allowlist: AllowedRange[]
  alert_rules: Record<string, boolean>
}

/* ── Team members list ─────────────────────────────────── */
export type MemberTfa = 'passkey' | 'authenticator' | 'none'
export type MemberStatus = 'active' | 'suspended'

export interface MemberRow {
  id: string
  name: string
  email: string
  role: string
  role_label: string
  job_title: string | null
  department: string | null
  status: MemberStatus
  last_seen: string | null
  online: boolean
  joined: string
  tfa: MemberTfa
  is_me: boolean
  can_manage: boolean
}

export interface MembersList {
  rows: MemberRow[]
  total: number
}

export interface MembersSummary {
  counts: { all: number; active: number; suspended: number }
  mini: { active: number; online: number; tfa: number; pending_invites: number; expiring_invites: number }
  departments: string[]
  can_manage: boolean
}

export interface MembersFilters {
  tab: string
  search: string
  role: string
  department: string
  tfa: string
}

export interface MemberEdit {
  full_name: string
  job_title: string
  department: string
  role: string
}
