// Video proxy for the mobile app's in-app player. ik.imagekit.io is blocked by some Indonesian ISPs, so
// the player asks this function, which fetches the file from ImageKit server-side and streams it back.
// Players read video in byte ranges ("Range: bytes=…") and are strict: AVPlayer rejects a response whose
// range differs from the one it asked for ("content range mismatch"). So the exact range is returned, and
// only a runaway request is capped (MAX_RANGE_BYTES), which is far above the size of our short videos.
//
// Public on purpose (the native player can't send a login token), so it only fetches video files from
// our own ImageKit endpoint, over GET/HEAD, and never follows redirects.
//
// The file is passed as ?p=videos/intro.mp4. Do NOT put it in the URL path ending in ".mp4": the CDN in
// front of Edge Functions then treats it as a static file and stops forwarding the Range header.
//
//   GET /functions/v1/vid?p=videos/intro_abc.mp4      (Range: bytes=0-)
const ENDPOINT = (Deno.env.get('IMAGEKIT_URL_ENDPOINT') ?? 'https://ik.imagekit.io/cq3bz6rgo').replace(/\/$/, '')
const MAX_RANGE_BYTES = Number(Deno.env.get('VIDEO_MAX_RANGE_BYTES') ?? 64 * 1024 * 1024)
const TIMEOUT_MS = 20_000

const PATH_RE = /^[A-Za-z0-9_\-./%~]+$/
const RANGE_RE = /^bytes=(\d+)-(\d*)$/

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'range',
  'Access-Control-Expose-Headers': 'content-range, accept-ranges, content-length',
}

const fail = (status: number, message: string, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...CORS, ...extra, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS })
  if (req.method !== 'GET' && req.method !== 'HEAD') return fail(405, 'Method not allowed')

  const path = new URL(req.url).searchParams.get('p') ?? ''
  if (!path || path.length > 300 || path.includes('..') || path.startsWith('/') || !PATH_RE.test(path)) {
    return fail(400, 'Invalid video request')
  }

  // No Range header = from the start. Only a range beyond MAX_RANGE_BYTES is shortened.
  const match = RANGE_RE.exec(req.headers.get('range') ?? 'bytes=0-')
  if (!match) return fail(416, 'Unsupported range')
  const start = Number(match[1])
  const end = Math.min(match[2] ? Number(match[2]) : Infinity, start + MAX_RANGE_BYTES - 1)
  if (end < start) return fail(416, 'Invalid range')

  let upstream: Response
  try {
    upstream = await fetch(`${ENDPOINT}/${path}`, {
      method: 'GET',
      headers: { Range: `bytes=${start}-${end}` },
      redirect: 'error',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })
  } catch {
    return fail(502, 'Could not reach the video host')
  }

  if (upstream.status === 404) return fail(404, 'Video not found')
  if (upstream.status === 416) {
    return fail(416, 'Range not satisfiable', { 'Content-Range': upstream.headers.get('content-range') ?? '*' })
  }

  const type = upstream.headers.get('content-type') ?? ''
  if (!type.startsWith('video/')) {
    await upstream.body?.cancel()
    return fail(415, 'Not a video')
  }

  const base = {
    ...CORS,
    'Content-Type': type,
    'Accept-Ranges': 'bytes',
    // ImageKit file names are unique per upload, so a given range never changes.
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
  }

  if (upstream.status === 206) {
    const range = upstream.headers.get('content-range') ?? ''
    const length = upstream.headers.get('content-length')
    return new Response(req.method === 'HEAD' ? null : upstream.body, {
      status: 206,
      headers: { ...base, 'Content-Range': range, ...(length ? { 'Content-Length': length } : {}) },
    })
  }

  // The host ignored the range and sent the whole file: fine only when it is small.
  const size = Number(upstream.headers.get('content-length') ?? 0)
  if (upstream.status === 200 && size > 0 && size <= MAX_RANGE_BYTES) {
    return new Response(req.method === 'HEAD' ? null : upstream.body, {
      status: 200,
      headers: { ...base, 'Content-Length': String(size) },
    })
  }
  await upstream.body?.cancel()
  return fail(502, 'The video host does not support partial downloads')
})
