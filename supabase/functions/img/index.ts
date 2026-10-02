// Image proxy for the mobile app. In Indonesia some ISPs block ik.imagekit.io (Internet Positif), so
// the app asks this function for the image and it fetches it from ImageKit server-side, where the
// block doesn't apply. It is public on purpose (images are shown by <Image> without a token), so it
// is strict about what it will fetch: only our own ImageKit endpoint, only images, only GET/HEAD.
//
//   GET /functions/v1/img?p=avatars/upload_abc.jpeg&tr=q-80,w-128,h-128
const ENDPOINT = (Deno.env.get('IMAGEKIT_URL_ENDPOINT') ?? 'https://ik.imagekit.io/cq3bz6rgo').replace(/\/$/, '')
const MAX_BYTES = 8 * 1024 * 1024
const TIMEOUT_MS = 10_000

// File path inside the ImageKit account: letters, digits and a few URL-safe characters, no "..".
const PATH_RE = /^[A-Za-z0-9_\-./%~]+$/
// ImageKit transformations such as "q-80,w-128,h-128" (names, digits, dashes, commas).
const TR_RE = /^[a-z0-9,\-:]{0,120}$/

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
}

const fail = (status: number, message: string) =>
  new Response(JSON.stringify({ error: message }), { status, headers: { ...CORS, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })
  if (req.method !== 'GET' && req.method !== 'HEAD') return fail(405, 'Method not allowed')

  const params = new URL(req.url).searchParams
  const path = params.get('p') ?? ''
  const tr = params.get('tr') ?? ''
  if (!path || path.length > 300 || path.includes('..') || path.startsWith('/') || !PATH_RE.test(path) || !TR_RE.test(tr)) {
    return fail(400, 'Invalid image request')
  }

  let upstream: Response
  try {
    upstream = await fetch(`${ENDPOINT}/${path}${tr ? `?tr=${tr}` : ''}`, {
      method: req.method,
      headers: { Accept: req.headers.get('accept') ?? 'image/*' },
      // Never follow redirects: they could lead somewhere other than our ImageKit account.
      redirect: 'error',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    return fail(502, 'Could not reach the image host')
  }

  if (upstream.status === 404) return fail(404, 'Image not found')
  if (!upstream.ok) return fail(502, 'Image host error')

  const type = upstream.headers.get('content-type') ?? ''
  if (!type.startsWith('image/')) return fail(415, 'Not an image')
  const length = Number(upstream.headers.get('content-length') ?? 0)
  if (length > MAX_BYTES) return fail(413, 'Image too large')

  const headers: Record<string, string> = {
    ...CORS,
    'Content-Type': type,
    // ImageKit file names are unique per upload, so a given URL never changes.
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
    // An SVG opened as a page must not run scripts.
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
  }
  if (length > 0) headers['Content-Length'] = String(length)
  return new Response(req.method === 'HEAD' ? null : upstream.body, { status: 200, headers })
})
