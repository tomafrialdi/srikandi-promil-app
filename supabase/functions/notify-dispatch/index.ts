// Notification dispatcher. Meant to be called every few minutes by Supabase Cron (see README.md):
//   1. notifications_dispatch(): creates the inbox rows for due campaigns and for triggers whose event
//      is happening at the user's local send time;
//   2. sends the pending pushes through the Expo push service and reports the results back.
// Without push credentials (FCM / APNs) step 2 fails per message and the failure is recorded for the
// console; the inbox part still works, so nothing is lost.
import { createClient } from 'npm:@supabase/supabase-js@2'

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
const EXPO_BATCH = 100 // Expo accepts up to 100 messages per request

interface PendingPush {
  id: string
  tokens: string[]
  title: string
  body: string
  data: Record<string, unknown>
}

interface Ticket {
  status: 'ok' | 'error'
  id?: string
  message?: string
  details?: { error?: string }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/** Constant-time comparison, so the secret can't be guessed from response timing. */
function sameSecret(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a)
  const y = new TextEncoder().encode(b)
  if (x.length !== y.length) return false
  let diff = 0
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i]
  return diff === 0
}

Deno.serve(async (req) => {
  const secret = Deno.env.get('DISPATCH_SECRET')
  if (!secret) return json({ error: 'DISPATCH_SECRET is not configured' }, 500)
  if (!sameSecret(req.headers.get('x-dispatch-secret') ?? '', secret)) return json({ error: 'Unauthorized' }, 401)

  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })

  const dispatched = await supabase.rpc('notifications_dispatch')
  if (dispatched.error) return json({ error: `dispatch failed: ${dispatched.error.message}` }, 500)

  const batch = await supabase.rpc('notifications_push_batch', { p_limit: 200 })
  if (batch.error) return json({ error: `push batch failed: ${batch.error.message}`, dispatched: dispatched.data }, 500)
  const pending = (batch.data ?? []) as PendingPush[]

  // One message per device token; remember which notification and token each belongs to.
  const messages: { to: string; title: string; body: string; data: Record<string, unknown>; sound: 'default'; priority: 'high'; channelId: string }[] = []
  const owner: { notification: string; token: string }[] = []
  for (const n of pending) {
    for (const token of n.tokens ?? []) {
      messages.push({ to: token, title: n.title, body: n.body, data: n.data, sound: 'default', priority: 'high', channelId: 'default' })
      owner.push({ notification: n.id, token })
    }
  }

  const tickets: Ticket[] = []
  let providerDown = false
  for (let i = 0; i < messages.length; i += EXPO_BATCH) {
    try {
      const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json' }
      const accessToken = Deno.env.get('EXPO_ACCESS_TOKEN')
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`
      const res = await fetch(EXPO_PUSH_URL, { method: 'POST', headers, body: JSON.stringify(messages.slice(i, i + EXPO_BATCH)) })
      const payload = await res.json().catch(() => null)
      const data = payload?.data
      if (!res.ok || !Array.isArray(data)) {
        // Whole request rejected: record it as a provider error for those messages.
        for (let j = i; j < Math.min(i + EXPO_BATCH, messages.length); j++) {
          tickets[j] = { status: 'error', message: payload?.errors?.[0]?.message ?? `HTTP ${res.status}`, details: { error: 'ProviderError' } }
        }
      } else {
        data.forEach((t: Ticket, k: number) => (tickets[i + k] = t))
      }
    } catch {
      // Network problem: leave these pending so the next run retries them.
      providerDown = true
      break
    }
  }

  // Collapse the per-token tickets into one result per notification.
  const results = new Map<string, Record<string, unknown>>()
  owner.forEach((o, idx) => {
    const ticket = tickets[idx]
    if (!ticket) return // not attempted (provider unreachable)
    const entry = results.get(o.notification) ?? { id: o.notification, status: 'failed', deadTokens: [] as string[] }
    if (ticket.status === 'ok') {
      entry.status = 'sent'
      entry.ticket = ticket.id
    } else {
      if (entry.status !== 'sent') {
        entry.error = ticket.details?.error ?? 'ProviderError'
        entry.token = o.token
      }
      if (ticket.details?.error === 'DeviceNotRegistered') (entry.deadTokens as string[]).push(o.token)
    }
    results.set(o.notification, entry)
  })

  const report = await supabase.rpc('notifications_push_report', { p_results: [...results.values()] })
  if (report.error) return json({ error: `push report failed: ${report.error.message}` }, 500)

  return json({
    dispatched: dispatched.data,
    push: {
      notifications: pending.length,
      messages: messages.length,
      sent: [...results.values()].filter((r) => r.status === 'sent').length,
      failed: [...results.values()].filter((r) => r.status === 'failed').length,
      retryLater: providerDown,
    },
  })
})
