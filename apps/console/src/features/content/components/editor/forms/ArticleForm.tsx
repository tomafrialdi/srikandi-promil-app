import { Image, LinkSimple, ListBullets, ListNumbers, Quotes, TextB, TextHTwo, TextItalic, DeviceMobile } from '@phosphor-icons/react'
import { useRef, useState, type ReactNode } from 'react'
import { ImageUpload, TextField, useToast } from '../../../../../shared/ui'
import { uploadFile } from '../../../../../shared/services/imagekit.service'
import { applyFormat, insertAt, type Edit, type Format } from '../../../lib/markdown'
import type { ContentForm } from '../../../types'
import { ChipToggleGroup, EditorCard } from '../fields'

interface ArticleFormProps {
  form: ContentForm
  set: <K extends keyof ContentForm>(key: K, value: ContentForm[K]) => void
}

const TOOLS: Array<{ format: Format; label: string; icon: ReactNode }> = [
  { format: 'h2', label: 'Heading', icon: <TextHTwo size={16} /> },
  { format: 'bold', label: 'Bold', icon: <TextB size={16} /> },
  { format: 'italic', label: 'Italic', icon: <TextItalic size={16} /> },
  { format: 'ul', label: 'Bulleted list', icon: <ListBullets size={16} /> },
  { format: 'ol', label: 'Numbered list', icon: <ListNumbers size={16} /> },
  { format: 'quote', label: 'Quote', icon: <Quotes size={16} /> },
  { format: 'link', label: 'Link', icon: <LinkSimple size={16} /> },
]

/** Article body is Markdown; `:::cta Label | deeplink` becomes an in-app call-to-action block. */
export function ArticleForm({ form, set }: ArticleFormProps) {
  const toast = useToast()
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const commit = (edit: Edit) => {
    set('body', edit.value)
    requestAnimationFrame(() => {
      const el = bodyRef.current
      if (!el) return
      el.focus()
      el.setSelectionRange(edit.selectionStart, edit.selectionEnd)
    })
  }

  const format = (kind: Format) => {
    const el = bodyRef.current
    commit(applyFormat(form.body, el?.selectionStart ?? form.body.length, el?.selectionEnd ?? form.body.length, kind))
  }

  const insertImage = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return toast({ tone: 'error', title: 'Please choose an image file.' })
    setUploading(true)
    try {
      const image = await uploadFile(file, '/articles/inline')
      const position = bodyRef.current?.selectionEnd ?? form.body.length
      commit(insertAt(form.body, position, `\n![${file.name.replace(/\.[^.]+$/, '')}](${image.url})\n`))
    } catch (err) {
      toast({ tone: 'error', title: 'Image upload failed', description: err instanceof Error ? err.message : undefined })
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const btn = 'inline-flex size-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-alt disabled:opacity-45'

  return (
    <EditorCard className="gap-4">
      <div className="flex flex-col gap-2">
        <ImageUpload value={form.image_url || null} folder="/articles" label="Add cover image" aspectClassName="aspect-[10/3]" onChange={(image) => set('image_url', image?.url ?? '')} />
        <TextField id="cover-alt" label="Cover alt text" hideLabel aria-label="Cover alt text" placeholder="Alt text: describe the cover image" value={form.cover_alt} onChange={(e) => set('cover_alt', e.target.value)} />
      </div>

      <div className="flex items-center gap-2.5">
        <ChipToggleGroup
          label="Languages"
          options={[{ value: 'en', label: 'EN' }, { value: 'id', label: 'ID' }]}
          selected={form.languages}
          onChange={(next) => next.length > 0 && set('languages', next as ContentForm['languages'])}
        />
        <span className="text-12 text-ink-faint">{form.languages.includes('id') ? 'Available in Bahasa Indonesia' : 'Bahasa Indonesia version: not started'}</span>
      </div>

      <textarea
        aria-label="Title"
        rows={2}
        className="w-full resize-none border-0 bg-transparent text-28 leading-tight font-extrabold outline-0 placeholder:text-ink-faint"
        placeholder="Article title"
        value={form.title}
        onChange={(e) => set('title', e.target.value)}
      />
      <textarea
        aria-label="Dek"
        rows={2}
        className="w-full resize-none border-0 bg-transparent text-15 leading-normal text-ink-muted outline-0 placeholder:text-ink-faint"
        placeholder="A one or two sentence summary shown under the title"
        value={form.dek}
        onChange={(e) => set('dek', e.target.value)}
      />

      <div className="flex flex-wrap items-center gap-0.5 rounded-xl border border-border px-1.5 py-1" role="toolbar" aria-label="Formatting">
        {TOOLS.map((tool) => (
          <button key={tool.format} type="button" className={btn} aria-label={tool.label} title={tool.label} onClick={() => format(tool.format)}>
            {tool.icon}
          </button>
        ))}
        <button type="button" className={btn} aria-label="Insert image" title="Insert image" disabled={uploading} onClick={() => fileRef.current?.click()}>
          <Image size={16} />
        </button>
        <span className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
        <button type="button" className={btn} aria-label="Insert app CTA" title="Insert app CTA" onClick={() => format('cta')}>
          <DeviceMobile size={16} />
        </button>
        <span className="ml-1 text-12 text-ink-faint">{uploading ? 'Uploading image…' : 'Insert app CTA'}</span>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => void insertImage(e.target.files?.[0])} />
      </div>

      <textarea
        ref={bodyRef}
        aria-label="Body"
        className="min-h-96 w-full resize-y rounded-xl border border-border bg-card p-4 font-mono text-13 leading-relaxed outline-0 placeholder:text-ink-faint focus-visible:border-primary"
        placeholder="Write in Markdown. Use ## for headings, and :::cta Label | srikandi://deep-link for an app call-to-action."
        value={form.body}
        onChange={(e) => set('body', e.target.value)}
      />
    </EditorCard>
  )
}
