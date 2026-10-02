import { Plus, Trash, UploadSimple } from '@phosphor-icons/react'
import { useRef, useState } from 'react'
import { Field, Segmented, TextAreaField, TextField, ToggleRow, useToast, SelectField } from '../../../../../shared/ui'
import { cn } from '../../../../../shared/lib/cn'
import { formatMinutes } from '../../../../../shared/lib/format'
import { uploadFile, videoThumbnail } from '../../../../../shared/services/imagekit.service'
import { CAPTION_LANGS, DEFAULT_CATEGORIES, VIDEO_PLACEMENTS } from '../../../config/editor'
import type { ContentForm } from '../../../types'
import { ChipToggleGroup, EditorCard, INPUT } from '../fields'

interface VideoFormProps {
  form: ContentForm
  set: <K extends keyof ContentForm>(key: K, value: ContentForm[K]) => void
}

const MAX_BYTES = 200 * 1024 * 1024

interface VideoMeta {
  duration: number | null
  /** Width / height as shown (phone videos recorded upright are already reported the right way round). */
  ratio: number | null
}

/** Reads the duration and shape from the file itself before uploading. */
function readMeta(file: File): Promise<VideoMeta> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)
    const done = (value: VideoMeta) => {
      URL.revokeObjectURL(url)
      resolve(value)
    }
    video.preload = 'metadata'
    video.onloadedmetadata = () =>
      done({
        duration: Number.isFinite(video.duration) ? Math.round(video.duration) : null,
        ratio: video.videoWidth > 0 && video.videoHeight > 0 ? Math.round((video.videoWidth / video.videoHeight) * 10000) / 10000 : null,
      })
    video.onerror = () => done({ duration: null, ratio: null })
    video.src = url
  })
}

const ORIENTATIONS = [
  { value: 'landscape' as const, label: 'Horizontal · 16:9' },
  { value: 'portrait' as const, label: 'Vertical · 9:16' },
]

export function VideoForm({ form, set }: VideoFormProps) {
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const upload = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('video/')) return toast({ tone: 'error', title: 'Please choose a video file.' })
    if (file.size > MAX_BYTES) return toast({ tone: 'error', title: 'Video must be 200 MB or smaller.' })
    setUploading(true)
    try {
      const [meta, uploaded] = await Promise.all([readMeta(file), uploadFile(file, '/videos')])
      set('video_url', uploaded.url)
      set('duration_seconds', meta.duration)
      // The shape comes from the file; the editor can still change it below.
      set('aspect_ratio', meta.ratio)
      if (meta.ratio) set('orientation', meta.ratio < 1 ? 'portrait' : 'landscape')
      set('image_url', '')
    } catch (err) {
      toast({ tone: 'error', title: 'Video upload failed', description: err instanceof Error ? err.message : undefined })
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const portrait = form.orientation === 'portrait'
  const thumbs = form.video_url && form.duration_seconds ? [0.1, 0.3, 0.5, 0.7].map((p) => videoThumbnail(form.video_url, form.duration_seconds! * p)) : []
  const setChapter = (i: number, patch: Partial<ContentForm['chapters'][number]>) => set('chapters', form.chapters.map((c, j) => (j === i ? { ...c, ...patch } : c)))

  return (
    <>
      <EditorCard className="gap-4">
        <div className={cn('relative flex items-center justify-center overflow-hidden rounded-xl bg-ink', portrait ? 'mx-auto aspect-[9/16] w-full max-w-[280px]' : 'aspect-video')}>
          {form.video_url ? (
            <video className="size-full" src={form.video_url} controls preload="metadata" poster={form.image_url || undefined} />
          ) : (
            <button type="button" className="flex flex-col items-center gap-2 text-13 font-bold text-white disabled:opacity-60" disabled={uploading} onClick={() => fileRef.current?.click()}>
              <UploadSimple size={26} />
              {uploading ? 'Uploading video…' : 'Upload video file'}
              <span className="text-11 font-medium text-white/70">MP4 or MOV, up to 200 MB</span>
            </button>
          )}
          {form.video_url && (
            <div className="absolute top-3 right-3 flex items-center gap-2">
              {form.duration_seconds && <span className="rounded-md bg-ink/70 px-2 py-1 text-11 font-bold text-white">{formatMinutes(form.duration_seconds)}</span>}
              <button type="button" className="rounded-md bg-card px-2.5 py-1 text-11 font-bold disabled:opacity-60" disabled={uploading} onClick={() => fileRef.current?.click()}>
                {uploading ? 'Uploading…' : 'Replace file'}
              </button>
            </div>
          )}
          <input ref={fileRef} type="file" accept="video/*" hidden onChange={(e) => void upload(e.target.files?.[0])} />
        </div>

        <Field label="Orientation" hint={form.aspect_ratio ? `Detected from the file (${form.aspect_ratio.toFixed(2)}:1)` : 'Shapes the card and player in the app'}>
          <Segmented label="Video orientation" size="lg" options={ORIENTATIONS} value={form.orientation} onChange={(v) => set('orientation', v)} />
        </Field>

        <TextField id="video-title" label="Title" maxLength={120} placeholder="What happens during IUI? A 4-minute walkthrough" value={form.title} onChange={(e) => set('title', e.target.value)} />
        <Field label="Description">
          <TextAreaField placeholder="What viewers will learn." value={form.body} onChange={(e) => set('body', e.target.value)} />
        </Field>
        <div className="grid gap-4 min-[600px]:grid-cols-2">
          <TextField id="presenter" label="Presenter" placeholder="dr. Sarah Lestari, SpOG-KFER" value={form.presenter} onChange={(e) => set('presenter', e.target.value)} />
          <Field label="Category" htmlFor="video-category">
            <SelectField id="video-category" value={form.category} options={Array.from(new Set([...DEFAULT_CATEGORIES, form.category])).map((c) => ({ value: c, label: c }))} onChange={(v) => set('category', v)} />
          </Field>
        </div>
      </EditorCard>

      <EditorCard title="Chapters & captions">
        <div className="flex flex-col gap-5 min-[900px]:flex-row">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-12 font-bold">Chapters</span>
              <button type="button" className="inline-flex items-center gap-1 text-12 font-bold text-primary" onClick={() => set('chapters', [...form.chapters, { at: '0:00', label: '' }])}>
                <Plus size={12} weight="bold" /> Add chapter
              </button>
            </div>
            {form.chapters.length === 0 && <p className="text-12 text-ink-muted">No chapters yet.</p>}
            {form.chapters.map((chapter, i) => (
              <div key={i} className="flex items-center gap-2">
                <input aria-label="Chapter time" className={cn(INPUT, 'h-9 w-16 flex-none px-2 text-center')} value={chapter.at} placeholder="0:00" onChange={(e) => setChapter(i, { at: e.target.value })} />
                <input aria-label="Chapter title" className={cn(INPUT, 'h-9')} value={chapter.label} placeholder="Chapter title" onChange={(e) => setChapter(i, { label: e.target.value })} />
                <button type="button" aria-label="Remove chapter" className="inline-flex size-8 flex-none items-center justify-center text-ink-muted" onClick={() => set('chapters', form.chapters.filter((_, j) => j !== i))}>
                  <Trash size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <Field label="Captions">
              <ChipToggleGroup label="Caption languages" options={CAPTION_LANGS} selected={form.captions} onChange={(v) => set('captions', v)} />
            </Field>
            <Field label="Transcript">
              <TextAreaField placeholder="Paste or write the transcript." value={form.transcript} onChange={(e) => set('transcript', e.target.value)} />
            </Field>
          </div>
        </div>
      </EditorCard>

      <EditorCard title="Thumbnail & placement">
        {thumbs.length === 0 ? (
          <p className="text-12 text-ink-muted">Upload a video to choose a thumbnail from its frames.</p>
        ) : (
          <div className={cn('grid gap-2.5', portrait ? 'grid-cols-4 min-[700px]:grid-cols-4' : 'grid-cols-2 min-[700px]:grid-cols-4')} role="radiogroup" aria-label="Thumbnail">
            {thumbs.map((src) => (
              <button key={src} type="button" role="radio" aria-checked={form.image_url === src} className={cn('overflow-hidden rounded-xl border-2', form.image_url === src ? 'border-primary' : 'border-transparent')} onClick={() => set('image_url', src)}>
                <img src={src} alt="" className={cn('w-full bg-surface-alt object-cover', portrait ? 'aspect-[9/16]' : 'aspect-video')} loading="lazy" />
              </button>
            ))}
          </div>
        )}
        <Field label="Show in">
          <ChipToggleGroup label="Placement" options={VIDEO_PLACEMENTS} selected={form.placement} onChange={(v) => set('placement', v)} />
        </Field>
        <ToggleRow label="Autoplay muted in feed" title="Autoplay muted in feed" description="First 6 seconds, then show play button" checked={form.autoplay_muted} onChange={(v) => set('autoplay_muted', v)} />
      </EditorCard>
    </>
  )
}
