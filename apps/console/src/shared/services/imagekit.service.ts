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
  if (error || !data) {
    const status = (error as { context?: Response } | null)?.context?.status
    if (status === 401 || status === 403) throw new Error('Your session is not allowed to upload. Sign in again with 2FA.')
    throw new Error('Upload service is unreachable. Is the imagekit-auth function running?')
  }
  return data
}

/** Uploads one file (image or video) straight to ImageKit, signed by the `imagekit-auth` Edge Function. */
export async function uploadFile(file: File, folder: string): Promise<UploadedImage> {
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

export const uploadImage = uploadFile

/** Still frame of an ImageKit video at `seconds`. */
export const videoThumbnail = (videoUrl: string, seconds: number) => `${videoUrl}/ik-thumbnail.jpg?tr=so-${Math.max(0, Math.floor(seconds))},w-480`

/** Adds ImageKit transformations to a stored URL, e.g. ikUrl(url, { w: 400, h: 300 }). Non-ImageKit URLs pass through. */
export function ikUrl(url: string | null | undefined, opts: { w?: number; h?: number; q?: number } = {}): string {
  if (!url) return ''
  if (!url.startsWith(env.imagekitUrlEndpoint)) return url
  const parts = ['f-auto', `q-${opts.q ?? 80}`]
  if (opts.w) parts.push(`w-${opts.w}`)
  if (opts.h) parts.push(`h-${opts.h}`)
  return `${url}${url.includes('?') ? '&' : '?'}tr=${parts.join(',')}`
}
