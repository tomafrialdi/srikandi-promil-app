import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, CaretRight, DeviceMobile, FingerprintSimple, Key, Timer, Warning } from '@phosphor-icons/react'
import { Button, Notice } from '../../../shared/ui'
import { AuthLayout } from '../components/AuthLayout'
import { CodeInput } from '../components/CodeInput'
import { useAuth } from '../hooks/useAuth'
import { logEvent, signOut } from '../services/auth.service'
import { enrollTotp, getVerifiedTotpFactorId, verifyTotp, type TotpEnrollment } from '../services/mfa.service'

const CODE_LENGTH = 6
const TOTP_PERIOD_SECONDS = 30

function useSecondsUntilRefresh() {
  const compute = () => TOTP_PERIOD_SECONDS - (Math.floor(Date.now() / 1000) % TOTP_PERIOD_SECONDS)
  const [seconds, setSeconds] = useState(compute)
  useEffect(() => {
    const id = window.setInterval(() => setSeconds(compute()), 1000)
    return () => window.clearInterval(id)
  }, [])
  return seconds
}

export function TwoFactorPage() {
  const { session, refresh } = useAuth()
  const [factorId, setFactorId] = useState<string | null>(null)
  const [enrollment, setEnrollment] = useState<TotpEnrollment | null>(null)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const secondsLeft = useSecondsUntilRefresh()
  const started = useRef(false)

  // Existing verified factor -> just ask for the code. Otherwise start enrollment.
  useEffect(() => {
    if (started.current) return
    started.current = true
    ;(async () => {
      try {
        const existing = await getVerifiedTotpFactorId()
        if (existing) {
          setFactorId(existing)
        } else {
          const next = await enrollTotp()
          setEnrollment(next)
          setFactorId(next.factorId)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not start two-factor verification.')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const submit = async (value: string) => {
    if (!factorId || value.length !== CODE_LENGTH || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await verifyTotp(factorId, value)
      await logEvent('auth.sign_in', 'console', { method: 'password+totp' }).catch(() => undefined)
      await refresh()
    } catch {
      setError('That code is incorrect or expired. Try the latest code from your authenticator app.')
      setCode('')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    void submit(code)
  }

  return (
    <AuthLayout>
      <button type="button" className="inline-flex items-center gap-1.5 self-start text-13 font-semibold text-ink-muted" onClick={() => void signOut()}>
        <ArrowLeft size={15} />
        {session?.user.email}
      </button>

      <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary-soft">
        <DeviceMobile size={26} color="var(--primary)" />
      </span>

      <div className="flex flex-col gap-1.5">
        <h1 className="text-28 font-extrabold text-ink">Two-factor verification</h1>
        <p className="text-14 leading-normal text-ink-muted">
          {enrollment
            ? 'Scan the QR code with your authenticator app (Google Authenticator, 1Password…), then enter the 6-digit code.'
            : 'Enter the 6-digit code from your authenticator app (Google Authenticator, 1Password…).'}
        </p>
      </div>

      {enrollment && (
        <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-3.5">
          <img className="flex-none rounded-lg" src={enrollment.qrCode} alt="Authenticator QR code" width={132} height={132} />
          <div className="flex min-w-0 flex-col gap-1.5">
            <span className="text-12 font-semibold text-ink-muted">Or enter this key manually</span>
            <code className="text-13 font-bold break-all">{enrollment.secret}</code>
          </div>
        </div>
      )}

      <form className="flex flex-col gap-5.5" onSubmit={handleSubmit}>
        <CodeInput
          length={CODE_LENGTH}
          value={code}
          onChange={setCode}
          onComplete={(value) => void submit(value)}
          disabled={loading || submitting}
          hasError={Boolean(error)}
        />

        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-12 font-semibold text-ink-faint">
            <Timer size={14} />
            Code refreshes in {secondsLeft} s
          </span>
          <span className="cursor-not-allowed text-13 font-bold text-primary opacity-60" title="Backup codes are not available yet">
            Use a backup code
          </span>
        </div>

        {error && (
          <Notice tone="error" icon={<Warning size={16} />}>
            {error}
          </Notice>
        )}

        <Button type="submit" block disabled={loading || submitting || code.length !== CODE_LENGTH}>
          {submitting ? 'Verifying…' : 'Verify & continue'}
        </Button>
      </form>

      <div className="flex flex-col gap-2.5">
        <span className="text-12 font-bold text-ink-faint">Other ways to verify</span>
        <button type="button" className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-3 text-left opacity-60" disabled title="Passkeys are not available yet">
          <FingerprintSimple size={17} />
          <span className="flex-1 text-13 font-semibold">Use passkey on this Mac</span>
          <CaretRight size={15} color="var(--ink-faint)" />
        </button>
        <button type="button" className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3.5 py-3 text-left opacity-60" disabled title="Security keys are not available yet">
          <Key size={17} />
          <span className="flex-1 text-13 font-semibold">Security key (YubiKey)</span>
          <CaretRight size={15} color="var(--ink-faint)" />
        </button>
      </div>

      <Notice tone="warning" icon={<Warning size={16} />}>
        5 wrong codes will lock the account for 15 minutes and alert Super admins.
      </Notice>
    </AuthLayout>
  )
}
