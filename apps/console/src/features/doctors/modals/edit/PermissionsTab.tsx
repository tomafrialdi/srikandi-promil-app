import { CheckCircle, Certificate, GitBranch, ChatsCircle, SignOut, Laptop, DeviceMobile, Desktop, ShieldCheck, UserFocus, type Icon } from '@phosphor-icons/react'
import { useState } from 'react'
import { Badge, Button, Checkbox, ConfirmDialog, ModalSection, Toggle, useToast } from '../../../../shared/ui'
import { timeAgo } from '../../../../shared/lib/format'
import { PERM_AREAS } from '../../config/labels'
import { revokeSession } from '../../services/doctors.service'
import type { DoctorForm, DoctorFull, DoctorSession } from '../../types'

interface PermissionsTabProps {
  doctor: DoctorFull
  form: DoctorForm
  setForm: (updater: (f: DoctorForm) => DoctorForm) => void
  onReload: () => void
}

const ROLES: Array<{ key: 'listed' | 'medical_reviewer' | 'engine_signoff' | 'community_expert' | 'public_advisor'; icon: Icon; title: string; detail: string; tint: string }> = [
  { key: 'listed', icon: UserFocus, title: 'Listed specialist', detail: 'Public profile in Find a specialist & booking', tint: 'var(--secondary-soft)' },
  { key: 'medical_reviewer', icon: CheckCircle, title: 'Medical reviewer', detail: 'Approves articles, medications & in-app health copy', tint: 'var(--primary-soft)' },
  { key: 'engine_signoff', icon: GitBranch, title: 'Engine sign-off', detail: 'Required approver for fertility-engine rule changes', tint: 'var(--warning-soft)' },
  { key: 'community_expert', icon: ChatsCircle, title: 'Verified community expert', detail: 'Can answer in community with a “Doctor” badge', tint: 'var(--success-soft)' },
  { key: 'public_advisor', icon: Certificate, title: 'Medical advisor (public)', detail: 'Shown on About us & website', tint: 'var(--surface-alt)' },
]

const deviceOf = (ua: string | null): { label: string; icon: Icon } => {
  const u = ua ?? ''
  const browser = /Edg\//.test(u) ? 'Edge' : /Chrome\//.test(u) ? 'Chrome' : /Safari\//.test(u) ? 'Safari' : /Firefox\//.test(u) ? 'Firefox' : ''
  if (/SrikandiAdmin|iPhone|Android/.test(u)) return { label: /iPhone/.test(u) ? 'iPhone · Srikandi Pro app' : 'Mobile · Srikandi Pro app', icon: DeviceMobile }
  if (/Macintosh/.test(u)) return { label: `MacBook${browser ? ` · ${browser}` : ''}`, icon: Laptop }
  return { label: `${/Windows/.test(u) ? 'Windows' : 'Computer'}${browser ? ` · ${browser}` : ''}`, icon: Desktop }
}

export function PermissionsTab({ doctor, form, setForm, onReload }: PermissionsTabProps) {
  const toast = useToast()
  const [revoking, setRevoking] = useState<DoctorSession | null>(null)
  const roleValue = (k: (typeof ROLES)[number]['key']) => (k === 'listed' ? form.flags.listed : form.flags[k])
  const setRole = (k: (typeof ROLES)[number]['key'], v: boolean) => setForm((f) => ({ ...f, flags: { ...f.flags, [k]: v } }))
  const setPerm = (area: string, key: 'view' | 'review' | 'approve' | 'publish', v: boolean) =>
    setForm((f) => ({ ...f, permissions: f.permissions.map((p) => (p.area === area ? { ...p, [key]: v } : p)) }))
  const permOf = (area: string) => form.permissions.find((p) => p.area === area)

  return (
    <>
      <ModalSection label="Roles on the platform">
        <div className="flex flex-col gap-2">
          {ROLES.map(({ key, icon: Glyph, title, detail, tint }) => (
            <div key={key} className="flex items-center gap-3 rounded-xl border border-border px-3.5 py-3">
              <span className="inline-flex size-9 flex-none items-center justify-center rounded-lg text-ink-muted" style={{ background: tint }}><Glyph size={17} /></span>
              <div className="flex min-w-0 flex-1 flex-col"><span className="text-13 font-bold">{title}</span><span className="text-11 text-ink-muted">{detail}</span></div>
              <Toggle label={title} checked={roleValue(key)} onChange={(v) => setRole(key, v)} />
            </div>
          ))}
        </div>
      </ModalSection>

      <ModalSection label="Granular permissions">
        <div className="overflow-x-auto rounded-xl border border-border">
          <div className="min-w-[520px]">
            <div className="grid grid-cols-[minmax(0,1.6fr)_repeat(4,72px)] items-center gap-2 bg-surface px-3.5 py-2.5 text-11 font-bold text-ink-faint uppercase">
              <span>Area</span><span className="text-center">View</span><span className="text-center">Review</span><span className="text-center">Approve</span><span className="text-center">Publish</span>
            </div>
            {PERM_AREAS.map((a) => (
              <div key={a.key} className="grid grid-cols-[minmax(0,1.6fr)_repeat(4,72px)] items-center gap-2 border-t border-border px-3.5 py-2.5">
                <span className="text-13 font-semibold">{a.label}</span>
                {(['view', 'review', 'approve', 'publish'] as const).map((k) => (
                  <span key={k} className="flex justify-center"><Checkbox label={`${a.label} ${k}`} checked={permOf(a.key)?.[k] ?? false} onChange={(v) => setPerm(a.key, k, v)} /></span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </ModalSection>

      <ModalSection label="Patient data access">
        <div className="flex flex-col gap-2 rounded-xl bg-secondary-soft px-3.5 py-3 text-12 text-ink">
          <span className="flex items-center gap-2 text-13 font-bold text-secondary"><ShieldCheck size={15} /> Consent-based only · UU PDP</span>
          <div className="flex justify-between gap-3"><span>Patients who shared a Doctor report</span><b>{doctor.stats.shared_reports ?? 0}</b></div>
          <div className="flex justify-between gap-3"><span>Active cycle-data shares</span><b>{doctor.stats.active_shares ?? 0} · auto-expire after 90 days</b></div>
          <div className="flex justify-between gap-3"><span>Access to other users&apos; data</span><b>Never — masked by default</b></div>
        </div>
      </ModalSection>

      <ModalSection label="Security">
        <div className="grid gap-3 min-[701px]:grid-cols-3">
          <div className="flex flex-col gap-0.5 rounded-xl bg-surface px-3.5 py-3"><span className="text-11 text-ink-muted">Two-factor auth</span><span className={doctor.security.tfa && doctor.security.tfa !== 'none' ? 'text-12 font-bold text-success' : 'text-12 font-bold text-warning-ink'}>{doctor.security.tfa == null ? 'No portal login yet' : doctor.security.tfa === 'none' ? 'Not set up' : `Enforced · ${doctor.security.tfa}`}</span></div>
          <div className="flex flex-col gap-0.5 rounded-xl bg-surface px-3.5 py-3"><span className="text-11 text-ink-muted">Portal login</span><span className="truncate text-12 font-bold">{doctor.portal_email ?? '—'}</span></div>
          <div className="flex flex-col gap-0.5 rounded-xl bg-surface px-3.5 py-3"><span className="text-11 text-ink-muted">Last login</span><span className="text-12 font-bold">{doctor.security.last_login ? timeAgo(doctor.security.last_login) : '—'}</span></div>
        </div>
        {doctor.security.sessions.length > 0 ? (
          <ul className="m-0 flex list-none flex-col rounded-xl border border-border p-0">
            {doctor.security.sessions.map((s) => {
              const dev = deviceOf(s.user_agent)
              const Glyph = dev.icon
              return (
                <li key={s.id} className="flex items-center gap-3 border-b border-border px-3.5 py-3 last:border-b-0">
                  <Glyph size={17} className="flex-none text-ink-muted" />
                  <span className="flex min-w-0 flex-1 flex-col"><span className="text-13 font-semibold">{dev.label}</span><span className="text-11 text-ink-muted">{s.ip ?? '—'} · {s.current ? 'this session' : timeAgo(s.last_seen_at)}</span></span>
                  {s.current ? <Badge tone="success">Current</Badge> : <Button variant="danger" onClick={() => setRevoking(s)} leadingIcon={<SignOut size={14} />}>Revoke</Button>}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="m-0 rounded-xl bg-surface px-3.5 py-3 text-12 text-ink-muted">No active portal sessions.</p>
        )}
      </ModalSection>
      <ConfirmDialog open={revoking !== null} onClose={() => setRevoking(null)} tone="danger" title="Revoke this session?" description="The device is signed out immediately. This is logged." confirmLabel="Revoke session"
        onConfirm={async () => { if (!revoking) return; await revokeSession(doctor.id, revoking.id); toast({ title: 'Session revoked' }); onReload() }} />
    </>
  )
}
