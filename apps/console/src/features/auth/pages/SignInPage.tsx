import { useState, type FormEvent } from 'react'
import { ArrowRight, Check, Envelope, Eye, EyeSlash, FingerprintSimple, GoogleLogo, Lock, Shield } from '@phosphor-icons/react'
import { cn } from '../../../shared/lib/cn'
import { Button, Notice, TextField } from '../../../shared/ui'
import { AuthLayout } from '../components/AuthLayout'
import { useAuth } from '../hooks/useAuth'
import { signInWithGoogle, signInWithPassword } from '../services/auth.service'

export function SignInPage() {
  const { accessDenied, dismissAccessDenied } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [trustDevice, setTrustDevice] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    dismissAccessDenied()
    setSubmitting(true)
    try {
      await signInWithPassword(email.trim(), password)
      // The auth guards route to the 2FA step (or the dashboard) from here.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogle = async () => {
    setError(null)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in is unavailable.')
    }
  }

  const message = error ?? (accessDenied ? 'This account does not have access to the admin console.' : null)

  return (
    <AuthLayout>
      <div className="flex flex-col gap-1.5">
        <h1 className="text-28 font-extrabold text-ink">Sign in to the console</h1>
        <p className="text-14 leading-normal text-ink-muted">
          Use your @srikandipromil.id Google Workspace account or clinic-issued admin email.
        </p>
      </div>

      <Button variant="outline" block onClick={handleGoogle} leadingIcon={<GoogleLogo size={20} weight="bold" color="#4285F4" />}>
        Continue with Google Workspace
      </Button>
      <Button
        variant="outline"
        block
        disabled
        title="Passkeys are not available yet"
        leadingIcon={<FingerprintSimple size={19} />}
      >
        Sign in with a passkey
      </Button>

      <div className="flex items-center gap-3 text-12 font-semibold text-ink-faint">
        <span className="h-px flex-1 bg-border" />
        or with email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form className="flex flex-col gap-5.5" onSubmit={handleSubmit}>
        <TextField
          id="email"
          type="email"
          label="Work email"
          placeholder="name@srikandipromil.id"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          icon={<Envelope size={17} />}
        />
        <TextField
          id="password"
          type={showPassword ? 'text' : 'password'}
          label="Password"
          placeholder="••••••••••••"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          icon={<Lock size={17} />}
          labelAction={<span className="text-13 font-bold text-primary">Forgot?</span>}
          trailing={
            <button
              type="button"
              className="inline-flex text-ink-muted"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? <EyeSlash size={17} /> : <Eye size={17} />}
            </button>
          }
        />

        <label className="relative flex cursor-pointer items-center gap-2.5 text-13 font-semibold">
          <input
            type="checkbox"
            className="peer absolute size-[18px] opacity-0"
            checked={trustDevice}
            onChange={(event) => setTrustDevice(event.target.checked)}
          />
          <span className={cn('inline-flex size-[18px] items-center justify-center rounded-[5px] border peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary', trustDevice ? 'border-primary bg-primary' : 'border-border bg-card')}>
            {trustDevice && <Check size={12} weight="bold" color="#fff" />}
          </span>
          Trust this device for 30 days
        </label>

        {message && (
          <Notice tone="error" icon={<Shield size={16} />}>
            {message}
          </Notice>
        )}

        <Button type="submit" block disabled={submitting} trailingIcon={<ArrowRight size={17} weight="bold" />}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      <Notice icon={<Shield size={16} />}>
        Authorised personnel only. Sign-ins are recorded. Need access? Ask a Super admin to send you an invite.
      </Notice>
    </AuthLayout>
  )
}
