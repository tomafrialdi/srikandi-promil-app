export interface AccountData {
  full_name: string
  display_name: string | null
  phone: string | null
  job_title: string | null
  department: string | null
  avatar_url: string | null
  email: string
  role: string
  role_label: string
  permissions: Array<{ area: string; level: string }>
  member_since: string
  invited_by: string | null
  deactivation_requested_at: string | null
  security: {
    totp: boolean
    totp_added_at: string | null
    password_changed_at: string | null
    backup_codes_left: number
    backup_codes_total: number
  }
}

export interface SessionRow {
  id: string
  user_agent: string | null
  ip: string | null
  created_at: string
  last_seen_at: string
  current: boolean
}

export interface ActivityRow {
  action: string
  at: string
  resource: string | null
}

export interface TokenRow {
  id: string
  name: string
  last4: string
  scopes: string[]
  allowed_ips: string | null
  expires_at: string
  last_used_at: string | null
  created_at: string
}

export interface TokensData {
  tokens: TokenRow[]
  max: number
  usage: { calls: number; errors: number; days: number[] } | null
}
