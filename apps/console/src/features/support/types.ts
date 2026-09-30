export type Priority = 'high' | 'medium' | 'low'
export type TicketStatus = 'open' | 'pending' | 'resolved'
export type Channel = 'app' | 'web' | 'whatsapp'
export type Category = 'bug' | 'billing' | 'privacy' | 'partner' | 'integrations' | 'account' | 'medical' | 'other'
export type MessageKind = 'customer' | 'agent' | 'note' | 'event'

export interface TicketRow {
  id: string
  number: number
  subject: string
  priority: Priority
  status: TicketStatus
  channel: Channel
  category: Category
  requester_name: string
  assigned_to: string | null
  assigned_name: string | null
  escalated_to: 'engine' | null
  last_message_at: string
  created_at: string
  tags: string[]
}

export interface TicketsList {
  rows: TicketRow[]
  total: number
}

export interface SupportSummary {
  open: number
  unassigned: number
  breaching: number
  first_response_seconds: number | null
  first_response_target_seconds: number
  csat_avg: number | null
  csat_count: number
  counts: { mine: number; unassigned: number; all: number }
  can_act: boolean
  me: string
  role: string
}

export interface Attachment {
  name: string
  url?: string
}

export interface TicketMessage {
  id: number
  kind: MessageKind
  author: string
  body: string
  attachments: Attachment[]
  at: string
  mine: boolean
}

export interface TicketFull extends TicketRow {
  requester: { user_id: string | null; name: string; email: string | null; platform: string | null; app_version: string | null; plan: string | null }
  first_response_at: string | null
  resolved_at: string | null
  csat: number | null
  csat_comment: string | null
  can_act: boolean
  messages: TicketMessage[]
}

export interface Agent {
  id: string
  name: string
  role: string
}

export interface Macro {
  id: string
  title: string
  shortcut: string
  body: string
  uses: number
}

export interface UserHit {
  id: string
  name: string
  email: string
  plan: string
  platform: string
}

export interface TicketFilters {
  tab: string
  search: string
  status: string
}
