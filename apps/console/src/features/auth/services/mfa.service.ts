import { supabase } from '../../../lib/supabase'

export interface TotpEnrollment {
  factorId: string
  qrCode: string
  secret: string
}

/** Returns the id of the user's verified TOTP factor, or null when none is enrolled. */
export async function getVerifiedTotpFactorId(): Promise<string | null> {
  const { data, error } = await supabase.auth.mfa.listFactors()
  if (error) throw error
  return data.totp[0]?.id ?? null
}

/** Starts TOTP enrollment, discarding any half-finished (unverified) attempt first. */
export async function enrollTotp(): Promise<TotpEnrollment> {
  const { data: factors, error: listError } = await supabase.auth.mfa.listFactors()
  if (listError) throw listError

  const stale = factors.all.filter((f) => f.factor_type === 'totp' && f.status === 'unverified')
  await Promise.all(stale.map((f) => supabase.auth.mfa.unenroll({ factorId: f.id })))

  const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Authenticator app' })
  if (error) throw error
  return { factorId: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret }
}

export async function verifyTotp(factorId: string, code: string) {
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
  if (error) throw error
}
