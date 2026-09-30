import { useState, type FormEvent } from 'react'
import { ArrowRight, Check, Envelope, Eye, EyeSlash, FingerprintSimple, GoogleLogo, Lock, Shield } from '@phosphor-icons/react'
import { Button, Notice, TextField } from '../../../shared/ui'
import { AuthLayout } from '../components/AuthLayout'
import { useAuth } from '../hooks/useAuth'
import { signInWithGoogle, signInWithPassword } from '../services/auth.service'
import styles from './AuthPages.module.css'

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
      <div className={styles.heading}>
        <h1 className={styles.title}>Sign in to the console</h1>
        <p className={styles.subtitle}>
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

      <div className={styles.divider}>
        <span className={styles.dividerLine} />
        or with email
        <span className={styles.dividerLine} />
      </div>

      <form className={styles.form} onSubmit={handleSubmit}>
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
          labelAction={<span className={styles.link}>Forgot?</span>}
          trailing={
            <button
              type="button"
              className={styles.iconButton}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? <EyeSlash size={17} /> : <Eye size={17} />}
            </button>
          }
        />

        <label className={styles.remember}>
          <input
            type="checkbox"
            className={styles.checkInput}
            checked={trustDevice}
            onChange={(event) => setTrustDevice(event.target.checked)}
          />
          <span className={styles.check}>{trustDevice && <Check size={12} weight="bold" color="#fff" />}</span>
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
