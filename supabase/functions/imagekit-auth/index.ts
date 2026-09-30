// Issues short-lived ImageKit upload credentials to signed-in console admins.
// The private key stays here (supabase secrets); the console only receives token/expire/signature.
import { createClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const EXPIRES_IN_SECONDS = 30 * 60 // ImageKit allows at most 1 hour

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

  // Act as the caller so is_console_admin() sees their JWT (active admin + aal2).
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: isAdmin, error } = await supabase.rpc('is_console_admin')
  if (error || isAdmin !== true) return json({ error: 'Forbidden' }, 403)

  const token = crypto.randomUUID()
  const expire = Math.floor(Date.now() / 1000) + EXPIRES_IN_SECONDS
  const signature = await sign(privateKey, token + expire)
  return json({ token, expire, signature })
})
