import { Bell, Clock, Globe, Key, PaperPlaneTilt, ShieldCheck, Warning, type Icon } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import { cn } from '../../../../shared/lib/cn'
import { Badge, Button, ConfirmDialog, Modal, ModalFooter, Notice, PageState, useToast } from '../../../../shared/ui'
import { useSecurity } from '../../hooks/useRolesData'
import { checkMyIp, requestSecurityChange, signOutAllSessions } from '../../services/roles.service'
import type { SecurityData, SecurityDraft, SecurityPolicy } from '../../types'
import { PendingBanner } from './PendingBanner'
import { FOOTER_HINT, isDirty, toDraft } from './security-draft'
import { AlertsTab } from './tabs/AlertsTab'
import { AuthenticationTab } from './tabs/AuthenticationTab'
import { DataProtectionTab } from './tabs/DataProtectionTab'
import { NetworkTab } from './tabs/NetworkTab'
import { SessionsTab } from './tabs/SessionsTab'

type TabKey = keyof typeof FOOTER_HINT

const TABS: Array<{ key: TabKey; label: string; icon: Icon }> = [
  { key: 'authentication', label: 'Authentication', icon: Key },
  { key: 'sessions', label: 'Sessions & devices', icon: Clock },
  { key: 'network', label: 'Network', icon: Globe },
  { key: 'data', label: 'Data protection', icon: ShieldCheck },
  { key: 'alerts', label: 'Alerts', icon: Bell },
]

const dayMonth = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short' })

interface SecuritySettingsModalProps {
  open: boolean
  onClose: () => void
}

/** Mount a fresh instance per opening (key it): the draft is created from the data fetched at mount. */
export function SecuritySettingsModal({ open, onClose }: SecuritySettingsModalProps) {
  const security = useSecurity()
  const data = security.data
  if (!data) {
    return (
      <Modal open={open} onClose={onClose} size="xl" icon={<ShieldCheck size={20} />} title="Security settings">
        <PageState
          title={security.error ? 'Could not load security settings' : 'Loading…'}
          description={security.error}
          action={security.error ? <Button variant="outline" onClick={security.reload}>Retry</Button> : undefined}
        />
      </Modal>
    )
  }
  return <SecurityEditor key={`${data.last_changed?.at}|${data.pending?.id}`} data={data} open={open} onClose={onClose} onReload={security.reload} />
}

interface SecurityEditorProps extends SecuritySettingsModalProps {
  data: SecurityData
  onReload: () => void
}

function SecurityEditor({ data, open, onClose, onReload }: SecurityEditorProps) {
  const toast = useToast()
  const [tab, setTab] = useState<TabKey>('authentication')
  const [initial] = useState(() => toDraft(data))
  const [draft, setDraft] = useState<SecurityDraft>(initial)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const [ipCheck, setIpCheck] = useState<{ ip: string | null; allowed: boolean | null }>()

  const dirty = isDirty(draft, initial)
  const blockedByOther = data.pending !== null && !data.pending.mine
  const ranges = draft.ip_allowlist
  const rangesKey = ranges.map((r) => r.cidr).join(',')

  useEffect(() => {
    if (tab !== 'network') return
    let cancelled = false
    const id = window.setTimeout(() => {
      checkMyIp(rangesKey ? rangesKey.split(',') : [])
        .then((result) => !cancelled && setIpCheck(result))
        .catch(() => !cancelled && setIpCheck(undefined))
    }, 300)
    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
  }, [tab, rangesKey])

  const lastUsed = useMemo(() => new Map(data.ip_allowlist.map((r) => [r.cidr, r.last_used_at])), [data.ip_allowlist])

  const setSection = <S extends keyof SecurityPolicy>(section: S) => (patch: Partial<SecurityPolicy[S]>) =>
    setDraft((current) => ({ ...current, policy: { ...current.policy, [section]: { ...current.policy[section], ...patch } } }))

  const submit = async () => {
    setSending(true)
    setError(null)
    try {
      await requestSecurityChange(draft)
      toast({ title: 'Change request sent', description: 'A second Super admin has to approve it before it applies.' })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the request.')
    } finally {
      setSending(false)
    }
  }

  const signOutAll = async () => {
    const count = await signOutAllSessions()
    toast({ title: `Signed out ${count} session${count === 1 ? '' : 's'}` })
    onReload()
  }

  const score = data.score
  const info =
    tab === 'network' ? (
      ipCheck?.ip == null ? (
        'Add ranges carefully — a wrong list can lock the team out'
      ) : ipCheck.allowed === false && draft.policy.network.ip_restricted ? (
        <span className="font-semibold text-error">Your IP {ipCheck.ip} is not in the allowlist</span>
      ) : (
        `Test before saving: your IP ${ipCheck.ip} is allowed ✓`
      )
    ) : tab === 'authentication' ? (
      data.last_changed ? `Last changed ${dayMonth.format(new Date(data.last_changed.at))} by ${data.last_changed.by}` : 'No changes yet'
    ) : (
      FOOTER_HINT[tab]
    )

  return (
    <>
      <Modal
        open={open}
        onClose={() => !sending && onClose()}
        size="xl"
        icon={<ShieldCheck size={20} />}
        title="Security settings"
        subtitle={`Organisation-wide policy for all ${data.stats.members} team members · changes need a second Super admin`}
        headerActions={<Badge tone={score >= 85 ? 'success' : score >= 70 ? 'warning' : 'error'}>{`Score ${score} / 100`}</Badge>}
        sidebar={
          <nav className="flex flex-none gap-1 overflow-x-auto border-b border-border bg-surface p-3 min-[701px]:w-60 min-[701px]:flex-col min-[701px]:border-r min-[701px]:border-b-0" aria-label="Security sections">
            {TABS.map(({ key, label, icon: Glyph }) => (
              <button
                key={key}
                type="button"
                aria-current={tab === key ? 'page' : undefined}
                className={cn('flex flex-none items-center gap-2.5 rounded-lg px-3 py-2.5 text-13 font-semibold whitespace-nowrap text-ink-muted', tab === key && 'bg-card font-bold text-ink shadow-[0_0_0_1px_var(--border)]')}
                onClick={() => setTab(key)}
              >
                <Glyph size={16} className={tab === key ? 'text-primary' : undefined} />
                {label}
              </button>
            ))}
          </nav>
        }
        footer={
          <ModalFooter info={info}>
            <Button variant="outline" onClick={onClose} disabled={sending}>Cancel</Button>
            <Button onClick={submit} disabled={sending || !data.can_edit || !dirty || blockedByOther} leadingIcon={<PaperPlaneTilt size={16} />}>
              {sending ? 'Sending…' : 'Request approval'}
            </Button>
          </ModalFooter>
        }
      >
        {data.pending && <PendingBanner pending={data.pending} canDecide={data.can_edit} onDone={onReload} />}
        {!data.can_edit && <Notice icon={<ShieldCheck size={16} />}>You can review the policy, but only Super admins can request changes.</Notice>}
        {error && <Notice tone="error" icon={<Warning size={16} />}>{error}</Notice>}
        <fieldset disabled={!data.can_edit} className="m-0 flex min-w-0 flex-col gap-5 border-0 p-0">
          {tab === 'authentication' && <AuthenticationTab value={draft.policy.authentication} onChange={setSection('authentication')} stats={data.stats} />}
          {tab === 'sessions' && <SessionsTab value={draft.policy.sessions} onChange={setSection('sessions')} data={data} canEdit={data.can_edit} onSignOutAll={() => setConfirmSignOut(true)} />}
          {tab === 'network' && (
            <NetworkTab
              value={draft.policy.network}
              onChange={setSection('network')}
              ranges={ranges}
              lastUsed={lastUsed}
              onRanges={(next) => setDraft((current) => ({ ...current, ip_allowlist: next }))}
            />
          )}
          {tab === 'data' && <DataProtectionTab value={draft.policy.data} onChange={setSection('data')} />}
          {tab === 'alerts' && (
            <AlertsTab
              value={draft.policy.alerts}
              onChange={setSection('alerts')}
              data={data}
              rules={data.alert_rules}
              enabled={draft.alert_rules}
              onRule={(key, on) => setDraft((current) => ({ ...current, alert_rules: { ...current.alert_rules, [key]: on } }))}
            />
          )}
        </fieldset>
      </Modal>
      <ConfirmDialog
        open={confirmSignOut}
        onClose={() => setConfirmSignOut(false)}
        tone="danger"
        title="Sign out all sessions?"
        description={`Ends ${data.sessions.active} console session${data.sessions.active === 1 ? '' : 's'}, except yours. Everyone signs in again with 2FA. This is recorded in the audit log.`}
        confirmLabel="Sign out all"
        onConfirm={signOutAll}
      />
    </>
  )
}

