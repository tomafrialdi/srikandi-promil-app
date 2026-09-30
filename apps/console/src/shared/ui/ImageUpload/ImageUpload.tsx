import { ImageSquare, Spinner, Trash } from '@phosphor-icons/react'
import { useRef, useState } from 'react'
import { cn } from '../../lib/cn'
import { ikUrl, uploadImage, type UploadedImage } from '../../services/imagekit.service'

const MAX_BYTES = 10 * 1024 * 1024
const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif'

interface ImageUploadProps {
  /** Current image URL (ImageKit). */
  value: string | null
  /** Called with the uploaded image, or null when removed. */
  onChange: (image: UploadedImage | null) => void
  /** ImageKit folder, e.g. "/articles". */
  folder: string
  label?: string
  className?: string
}

/** Click-to-upload image box. Uploads to ImageKit immediately and reports the URL via `onChange`. */
export function ImageUpload({ value, onChange, folder, label = 'Upload image', className }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File | undefined) {
    if (!file) return
    setError(null)
    if (!file.type.startsWith('image/')) return setError('Please choose an image file.')
    if (file.size > MAX_BYTES) return setError('Image must be 10 MB or smaller.')
    setBusy(true)
    try {
      onChange(await uploadImage(file, folder))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Image upload failed.')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-control border border-dashed border-border bg-surface-alt">
        {value ? (
          <img src={ikUrl(value, { w: 640 })} alt="" className="size-full object-cover" />
        ) : (
          <button
            type="button"
            className="flex size-full flex-col items-center justify-center gap-1.5 text-12 font-semibold text-ink-muted disabled:opacity-55"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            <ImageSquare size={24} />
            {label}
          </button>
        )}
        {value && !busy && (
          <div className="absolute top-2 right-2 flex gap-1.5">
            <button type="button" className="rounded-md bg-card px-2 py-1 text-11 font-bold text-ink shadow-tooltip" onClick={() => inputRef.current?.click()}>
              Replace
            </button>
            <button type="button" aria-label="Remove image" className="rounded-md bg-card p-1.5 text-error shadow-tooltip" onClick={() => onChange(null)}>
              <Trash size={14} />
            </button>
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/70 text-primary">
            <Spinner size={24} className="animate-spin motion-reduce:animate-none" />
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept={ACCEPT} hidden onChange={(e) => void handleFile(e.target.files?.[0])} />
      {error && <p className="text-11 font-semibold text-error">{error}</p>}
    </div>
  )
}
