import { env } from '../../config/env'
import { supabase } from '../../lib/supabase'

const UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload'

export interface UploadedImage {
  url: string
  fileId: string
  name: string
}

interface UploadAuth {
  token: string
  expire: number
  signature: string
}

async function getUploadAuth(): Promise<UploadAuth> {
  const { data, error } = await supabase.functions.invoke<UploadAuth>('imagekit-auth')
  if (error || !data) throw new Error('Could not authorise the upload. Please sign in again.')
  return data
}

/** Uploads one image straight to ImageKit (signed by the `imagekit-auth` Edge Function). */
export async function uploadImage(file: File, folder: string): Promise<UploadedImage> {
  const auth = await getUploadAuth()
  const form = new FormData()
  form.append('file', file)
  form.append('fileName', file.name)
  form.append('folder', folder)
  form.append('useUniqueFileName', 'true')
  form.append('publicKey', env.imagekitPublicKey)
  form.append('token', auth.token)
  form.append('expire', String(auth.expire))
  form.append('signature', auth.signature)

  const response = await fetch(UPLOAD_URL, { method: 'POST', body: form })
  const body = (await response.json().catch(() => null)) as { url?: string; fileId?: string; name?: string; message?: string } | null
  if (!response.ok || !body?.url || !body.fileId) throw new Error(body?.message ?? 'Image upload failed.')
  return { url: body.url, fileId: body.fileId, name: body.name ?? file.name }
}

/** Adds ImageKit transformations to a stored URL, e.g. ikUrl(url, { w: 400, h: 300 }). Non-ImageKit URLs pass through. */
export function ikUrl(url: string | null | undefined, opts: { w?: number; h?: number; q?: number } = {}): string {
  if (!url) return ''
  if (!url.startsWith(env.imagekitUrlEndpoint)) return url
  const parts = ['f-auto', `q-${opts.q ?? 80}`]
  if (opts.w) parts.push(`w-${opts.w}`)
  if (opts.h) parts.push(`h-${opts.h}`)
  return `${url}${url.includes('?') ? '&' : '?'}tr=${parts.join(',')}`
}
