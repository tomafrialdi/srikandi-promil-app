import { Warning } from '@phosphor-icons/react'
import { useState } from 'react'
import { Badge, Button, Field, Modal, ModalFooter, Notice, SelectField, TextField, useToast } from '../../../shared/ui'
import { cn } from '../../../shared/lib/cn'
import { TOKEN_EXPIRY_OPTIONS, TOKEN_SCOPES, UNAVAILABLE_SCOPE } from '../config/options'
import { createToken } from '../services/account.service'

interface CreateTokenModalProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
}

export function CreateTokenModal({ open, onClose, onCreated }: CreateTokenModalProps) {
  const toast = useToast()
  const [name, setName] = useState('')
  const [scopes, setScopes] = useState<string[]>([])
  const [days, setDays] = useState('90')
  const [ips, setIps] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [created, setCreated] = useState<string | null>(null)

  const close = () => {
    if (busy) return
    setName('')
    setScopes([])
    setDays('90')
    setIps('')
    setError(null)
    setCreated(null)
    onClose()
  }

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      const result = await createToken(name, scopes, Number(days), ips)
      setCreated(result.token)
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the token.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={created ? 'Your new token' : 'Create API token'}
      subtitle="The token is shown only once. It inherits your role but is limited to the scopes below."
      size="sm"
      footer={
        <ModalFooter>
          {created ? (
            <Button onClick={close}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={close} disabled={busy}>Cancel</Button>
              <Button onClick={submit} disabled={busy || name.trim().length < 2 || scopes.length === 0}>{busy ? 'Creating…' : 'Create token'}</Button>
            </>
          )}
        </ModalFooter>
      }
    >
      {created ? (
        <>
          <div className="flex items-center justify-between gap-2"><span className="text-13 font-bold">Copy it now</span><Badge tone="warning">shown once</Badge></div>
          <code className="block rounded-xl bg-surface p-3.5 font-mono text-12 font-semibold break-all">{created}</code>
          <Button variant="outline" className="self-start" onClick={() => void navigator.clipboard.writeText(created).then(() => toast({ title: 'Token copied' }))}>Copy token</Button>
          <Notice tone="warning" icon={<Warning size={16} />}>We only keep a hash of the token, so it cannot be shown again. Store it in your secret manager.</Notice>
        </>
      ) : (
        <>
          <TextField id="token-name" label="Token name" maxLength={60} placeholder="Looker Studio · subscriptions dashboard" value={name} onChange={(e) => setName(e.target.value)} />
          <Field label="Scopes" hint="read-only recommended">
            <div className="flex flex-col gap-2">
              {TOKEN_SCOPES.map((s) => (
                <label key={s.key} className={cn('flex cursor-pointer items-start gap-2.5 rounded-xl border p-3', scopes.includes(s.key) ? 'border-primary bg-primary-soft' : 'border-border')}>
                  <input type="checkbox" className="mt-0.5 accent-primary" checked={scopes.includes(s.key)} onChange={(e) => setScopes(e.target.checked ? [...scopes, s.key] : scopes.filter((x) => x !== s.key))} />
                  <span className="flex flex-col gap-0.5"><span className="font-mono text-12 font-bold">{s.key}</span><span className="text-11 text-ink-muted">{s.description}</span></span>
                </label>
              ))}
              <div className="flex items-start gap-2.5 rounded-xl border border-border p-3 opacity-55">
                <input type="checkbox" disabled className="mt-0.5" />
                <span className="flex flex-col gap-0.5"><span className="font-mono text-12 font-bold">{UNAVAILABLE_SCOPE.key}</span><span className="text-11 text-ink-muted">{UNAVAILABLE_SCOPE.description}</span></span>
              </div>
            </div>
          </Field>
          <div className="grid gap-4 min-[600px]:grid-cols-2">
            <Field label="Expires" htmlFor="token-expiry"><SelectField id="token-expiry" value={days} options={TOKEN_EXPIRY_OPTIONS} onChange={setDays} /></Field>
            <TextField id="token-ips" label="Allowed IPs" placeholder="34.101.0.0/16 (optional)" value={ips} onChange={(e) => setIps(e.target.value)} />
          </div>
          {error && <Notice tone="error" icon={<Warning size={16} />}>{error}</Notice>}
        </>
      )}
    </Modal>
  )
}
