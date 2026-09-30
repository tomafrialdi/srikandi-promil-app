import { ShieldCheck, Warning } from '@phosphor-icons/react'
import { useState } from 'react'
import { Badge, Button, Card, CardHeader, ConfirmDialog, Notice, PageState, useDisclosure, useToast } from '../../../shared/ui'
import { Columns } from '../../../shared/charts'
import { formatNumber } from '../../../shared/lib/format'
import { useTokens } from '../hooks/useAccountData'
import { ago, formatDate } from '../lib'
import { CreateTokenModal } from '../modals/CreateTokenModal'
import { revokeToken } from '../services/account.service'
import type { TokenRow } from '../types'

const daysLeft = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)

export function ApiTokensTab() {
  const toast = useToast()
  const tokens = useTokens()
  const create = useDisclosure()
  const [revoking, setRevoking] = useState<TokenRow | null>(null)

  if (tokens.error && !tokens.data) return <PageState title="Couldn't load tokens" description={tokens.error} action={<Button onClick={tokens.reload}>Try again</Button>} />
  const data = tokens.data
  const list = data?.tokens ?? []
  const usage = data?.usage

  return (
    <>
      <Notice icon={<ShieldCheck size={16} />}>Tokens can never read unmasked health data. Every call is written to the audit log with the token ID.</Notice>
      <Notice tone="warning" icon={<Warning size={16} />}>You can create and revoke tokens now. The API that accepts them is not enabled yet, so they don’t work for requests today.</Notice>

      <Card className="gap-2">
        <CardHeader
          title="Personal access tokens"
          subtitle={data ? `${list.length} active · max ${data.max}` : '…'}
          action={<Button disabled={!data || list.length >= data.max} onClick={create.onOpen}>Create token</Button>}
        />
        {data && list.length === 0 && <p className="py-4 text-13 text-ink-muted">No tokens yet.</p>}
        {list.map((t) => {
          const left = daysLeft(t.expires_at)
          return (
            <div key={t.id} className="flex flex-wrap items-center gap-3 border-t border-border py-3">
              <div className="flex min-w-40 flex-1 flex-col gap-0.5">
                <span className="text-13 font-bold">{t.name}</span>
                <span className="font-mono text-11 text-ink-muted">spa_live_••••{t.last4}</span>
              </div>
              <div className="flex flex-1 flex-wrap gap-1.5">
                {t.scopes.map((s) => <span key={s} className="rounded-md bg-surface-alt px-2 py-1 font-mono text-10 font-bold">{s}</span>)}
              </div>
              <span className="w-24 text-12 text-ink-muted">{t.last_used_at ? ago(t.last_used_at) : 'never used'}</span>
              <Badge tone={left <= 14 ? 'warning' : 'neutral'}>{left <= 14 ? `in ${Math.max(left, 0)} days` : formatDate(t.expires_at)}</Badge>
              <Button variant="danger" onClick={() => setRevoking(t)}>Revoke</Button>
            </div>
          )
        })}
      </Card>

      <Card>
        <CardHeader title="Usage (30 days)" />
        {usage && usage.calls > 0 ? (
          <Columns items={usage.days.map((n, i) => ({ label: i % 5 === 0 ? String(i + 1) : '', value: n, color: 'var(--secondary)', tooltipTitle: `Day ${i + 1}`, tooltipValue: `${formatNumber(n)} calls`, seriesName: 'API calls' }))} height={90} gap={3} radius={2} />
        ) : (
          <p className="text-13 text-ink-muted">No calls yet.</p>
        )}
        <p className="text-11 text-ink-faint">{formatNumber(usage?.calls ?? 0)} API calls · {formatNumber(usage?.errors ?? 0)} errors · rate limit 60 req/min</p>
      </Card>

      <CreateTokenModal open={create.open} onClose={create.onClose} onCreated={tokens.reload} />
      <ConfirmDialog
        open={revoking !== null}
        onClose={() => setRevoking(null)}
        tone="danger"
        title={`Revoke “${revoking?.name ?? ''}”?`}
        description="Anything using this token stops working immediately. This cannot be undone."
        confirmLabel="Revoke token"
        onConfirm={async () => {
          if (!revoking) return
          await revokeToken(revoking.id)
          toast({ title: 'Token revoked' })
          tokens.reload()
        }}
      />
    </>
  )
}
