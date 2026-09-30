import type { Approval, EngineState, EngineVersion, ModeKey, SignalKey, Weights } from './types'

export const WEIGHT_KEYS: Record<ModeKey, SignalKey[]> = {
  ttc: ['lh', 'cf', 'bbt', 'calendar', 'skin'],
  pcos: ['lh', 'cf', 'bbt', 'calendar', 'skin'],
  iui_ivf: ['lh', 'cf', 'bbt', 'calendar', 'protocol'],
  after_loss: ['lh', 'cf', 'bbt', 'calendar', 'skin'],
}

export const weightSum = (w: Weights) => Math.round(Object.values(w).reduce((a, b) => a + b, 0) * 100) / 100
export const fmtWeight = (n: number) => n.toFixed(2)

/** "Live v3.4" / "Canary v3.5 · 5%" / "Draft v3.6" */
export function versionChip(v: Pick<EngineVersion, 'version' | 'status' | 'rollout_pct'>): string {
  switch (v.status) {
    case 'canary':
      return `Canary ${v.version} · ${v.rollout_pct}%`
    case 'live':
      return `Live ${v.version}`
    case 'in_review':
      return `In review ${v.version}`
    case 'draft':
      return `Draft ${v.version}`
    case 'rolled_back':
      return `Rolled back ${v.version}`
    default:
      return `Archived ${v.version}`
  }
}

const shortName = (name: string) => {
  const parts = name.trim().split(/\s+/)
  return parts.length < 2 ? name : `${parts.slice(0, -1).join(' ')} ${parts[parts.length - 1]![0]}.`
}

/** "1 of 2 medical approvals · dr. Andi W. approved · waiting on dr. Sarah L." */
export function approvalsLine(approvals: Approval[]): string | null {
  if (approvals.length === 0) return null
  const done = approvals.filter((a) => a.decision === 'approved')
  const waiting = approvals.filter((a) => a.decision === 'pending')
  const parts = [`${done.length} of ${approvals.length} medical approvals`]
  if (done.length) parts.push(`${done.map((a) => shortName(a.name)).join(', ')} approved`)
  if (waiting.length) parts.push(`waiting on ${waiting.map((a) => shortName(a.name)).join(', ')}`)
  return parts.join(' · ')
}

export const canEditNow = (state: EngineState) => state.me.can_edit && state.subject?.status !== 'in_review'

const day = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
export const fmtDate = (iso: string | null) => (iso ? day.format(new Date(iso)) : '—')
export const daysSince = (iso: string | null) => (iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)) : 0)

/** The version a change will be saved into: the open draft, else the next number after the newest version. */
export function draftVersion(state: EngineState): string {
  const working = state.versions.find((v) => v.status === 'draft' || v.status === 'in_review')
  if (working) return working.version
  const nums = state.versions.map((v) => v.version.replace(/^v/, '').split('.').map(Number) as [number, number])
  if (nums.length === 0) return 'v1.0'
  const [major, minor] = nums.sort((a, b) => b[0] - a[0] || b[1] - a[1])[0]!
  return `v${major}.${minor + 1}`
}

/** What the primary button does, by where the newest version is in its lifecycle. */
export function releaseAction(state: EngineState): { label: string; enabled: boolean } | null {
  const s = state.subject
  if (!s) return null
  switch (s.status) {
    case 'draft':
      return { label: `Submit ${s.version} for review`, enabled: state.me.can_release }
    case 'in_review':
      return { label: `Review ${s.version}`, enabled: true }
    case 'canary':
      return { label: `Roll out ${s.version}`, enabled: true }
    default:
      return null
  }
}

