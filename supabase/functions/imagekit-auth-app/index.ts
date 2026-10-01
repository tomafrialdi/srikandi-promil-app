// Issues short-lived ImageKit upload credentials to signed-in mobile app users (profile photos).
// The private key stays here (supabase secrets); the app only receives token/expire/signature.
import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
// Short on purpose: a profile photo is one small upload, started right after the token is issued.
const EXPIRES_IN_SECONDS = 5 * 60

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

async function sign(privateKey: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(privateKey), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(message))
  return Array.from(new Uint8Array(mac), (b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const privateKey = Deno.env.get('IMAGEKIT_PRIVATE_KEY')
  if (!privateKey) return json({ error: 'IMAGEKIT_PRIVATE_KEY is not configured' }, 500)

  // Act as the caller: RLS only returns the caller's own app_users row, so a row means
  // "a signed-in app user" (console admins without an app profile are refused).
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data, error } = await supabase.from('app_users').select('id').maybeSingle()
  if (error || !data) return json({ error: 'Forbidden' }, 403)

  const token = crypto.randomUUID()
  const expire = Math.floor(Date.now() / 1000) + EXPIRES_IN_SECONDS
  const signature = await sign(privateKey, token + expire)
  return json({ token, expire, signature })
})
