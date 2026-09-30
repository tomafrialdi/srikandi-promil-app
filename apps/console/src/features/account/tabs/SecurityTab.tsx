import { CheckCircle, DeviceMobile, Fingerprint, Key, Laptop, ShieldWarning, UsersThree } from '@phosphor-icons/react'
import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, CardHeader, ConfirmDialog, PageState, Tooltip, TooltipBody, useDisclosure, useToast } from '../../../shared/ui'
import { useAccount, useActivity, useSessions } from '../hooks/useAccountData'
import { activityLabel, ago, daysSince, describeUserAgent, formatDate, formatWhen } from '../lib'
import { BackupCodesModal } from '../modals/BackupCodesModal'
import { ChangePasswordModal } from '../modals/ChangePasswordModal'
import { revokeSession, signOutOtherSessions } from '../services/account.service'

function Method({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3.5 border-b border-border py-3.5 last:border-b-0">
      <span className="inline-flex size-9 flex-none items-center justify-center rounded-[10px] bg-surface text-ink-muted">{icon}</span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-13 font-bold">{title}</span>
        <span className="text-12 text-ink-muted">{description}</span>
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  )
}

export function SecurityTab() {
  const toast = useToast()
  const account = useAccount()
  const sessions = useSessions()
  const activity = useActivity()
  const password = useDisclosure()
  const codes = useDisclosure()
  const others = useDisclosure()
  const [busy, setBusy] = useState(false)

  if (account.error && !account.data) return <PageState title="Couldn't load security settings" description={account.error} action={<Button onClick={account.reload}>Try again</Button>} />
  const a = account.data
  if (!a) return <PageState title="Loading…" />

  const pwDays = daysSince(a.security.password_changed_at)
  const issues = [
    !a.security.totp && 'two-factor authentication is off',
    pwDays == null ? 'the password has never been changed' : pwDays > 90 ? `the password is ${pwDays} days old` : null,
  ].filter(Boolean) as string[]
  const protectedOk = issues.length === 0

  const revoke = async (id: string) => {
    setBusy(true)
    try {
      await revokeSession(id)
      toast({ title: 'Session revoked' })
      sessions.reload()
      activity.reload()
    } catch (err) {
      toast({ tone: 'error', title: 'Could not revoke', description: err instanceof Error ? err.message : undefined })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className={protectedOk ? 'flex items-center gap-3.5 rounded-card border border-success/30 bg-success-soft p-4' : 'flex items-center gap-3.5 rounded-card border border-warning/30 bg-warning-soft p-4'}>
        {protectedOk ? <CheckCircle size={26} weight="fill" className="flex-none text-success" /> : <ShieldWarning size={26} weight="fill" className="flex-none text-warning-ink" />}
        <div className="flex flex-col gap-0.5">
          <span className="text-14 font-extrabold">{protectedOk ? 'Your account is well protected' : 'Your account needs attention'}</span>
          <span className="text-12 text-ink-muted">
            {protectedOk
              ? `2FA enabled · password changed ${pwDays} days ago · recent sign-ins look normal`
              : `Fix this: ${issues.join(', ')}.`}
          </span>
        </div>
      </div>

      <Card className="gap-1">
        <CardHeader title="Sign-in methods" />
        <Method icon={<Key size={18} />} title="Password" description={a.security.password_changed_at ? `Last changed ${formatDate(a.security.password_changed_at)} · rotate every 90 days` : 'Never changed from the initial password'}>
          <Button variant="outline" onClick={password.onOpen}>Change password</Button>
        </Method>
        <Method icon={<DeviceMobile size={18} />} title="Authenticator app (TOTP)" description={a.security.totp ? `Added ${formatDate(a.security.totp_added_at)}` : 'Not set up'}>
          <Badge tone={a.security.totp ? 'success' : 'warning'}>{a.security.totp ? 'Enabled' : 'Off'}</Badge>
          <Button variant="outline" onClick={codes.onOpen}>Backup codes</Button>
        </Method>
        <Method icon={<Fingerprint size={18} />} title="Passkeys" description="Sign in with Face ID, Touch ID or a security key">
          <Tooltip placement="bottom" align="end" content={<TooltipBody title="Passkeys aren't supported by our sign-in service yet" />}>
            <Button variant="outline" disabled>Add passkey</Button>
          </Tooltip>
        </Method>
      </Card>

      <Card className="gap-1">
        <CardHeader
          title="Active sessions"
          subtitle="Sessions expire after 30 min idle"
          action={<Button variant="danger" disabled={busy || (sessions.data?.length ?? 0) < 2} onClick={others.onOpen}>Sign out other sessions</Button>}
        />
        {sessions.data && sessions.data.length === 0 && <p className="py-3 text-13 text-ink-muted">No active sessions found.</p>}
        {(sessions.data ?? []).map((s) => (
          <Method
            key={s.id}
            icon={/iPhone|iPad|Android/.test(s.user_agent ?? '') ? <DeviceMobile size={18} /> : <Laptop size={18} />}
            title={describeUserAgent(s.user_agent)}
            description={`${s.ip ?? 'Unknown IP'} · ${s.current ? 'now' : ago(s.last_seen_at)}`}
          >
            {s.current ? <Badge tone="success">This device</Badge> : <Button variant="outline" disabled={busy} onClick={() => void revoke(s.id)}>Revoke</Button>}
          </Method>
        ))}
      </Card>

      <Card className="gap-2">
        <CardHeader title="Recent security activity" subtitle="From the audit log" action={<Link to="/audit-log" className="text-12 font-bold text-primary">View all →</Link>} />
        {activity.data && activity.data.length === 0 && <p className="text-13 text-ink-muted">Nothing yet.</p>}
        {(activity.data ?? []).map((row, i) => (
          <div key={i} className="flex items-center justify-between gap-3 border-b border-border py-2 text-13 last:border-b-0">
            <span className="font-semibold">{activityLabel(row.action)}</span>
            <span className="text-12 text-ink-muted">{formatWhen(row.at)}</span>
          </div>
        ))}
      </Card>

      <ChangePasswordModal open={password.open} email={a.email} onClose={password.onClose} onChanged={() => { account.reload(); sessions.reload(); activity.reload() }} />
      <BackupCodesModal open={codes.open} left={a.security.backup_codes_left} total={a.security.backup_codes_total} onClose={codes.onClose} onChanged={() => { account.reload(); activity.reload() }} />
      <ConfirmDialog
        open={others.open}
        onClose={others.onClose}
        tone="danger"
        icon={<UsersThree size={20} />}
        title="Sign out other sessions?"
        description="Every other browser and device will need to sign in again. This device stays signed in."
        confirmLabel="Sign out others"
        onConfirm={async () => {
          await signOutOtherSessions()
          toast({ title: 'Other sessions signed out' })
          sessions.reload()
        }}
      />
    </>
  )
}
