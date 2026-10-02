import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAsyncData } from '../../../shared/hooks/useAsyncData'
import { Button, PageState, useToast } from '../../../shared/ui'
import { timeAgo } from '../../../shared/lib/format'
import { EditorHeader } from '../components/editor/EditorHeader'
import { ArticleForm } from '../components/editor/forms/ArticleForm'
import { CardForm } from '../components/editor/forms/CardForm'
import { TipForm } from '../components/editor/forms/TipForm'
import { VideoForm } from '../components/editor/forms/VideoForm'
import { SettingsColumn } from '../components/editor/settings/SettingsColumn'
import { TypeTabs } from '../components/editor/TypeTabs'
import { WorkflowSteps } from '../components/editor/WorkflowSteps'
import { emptyForm } from '../config/editor'
import { STATUS_BADGE } from '../config/labels'
import { formToPayload, recordToForm } from '../lib/form-mapping'
import { bulkContentAction, fetchContent, fetchContentOptions, saveContent } from '../services/content.service'
import type { ContentForm, ContentRecord, ContentStatus, ContentType } from '../types'

const TYPES: ContentType[] = ['article', 'daily_tip', 'in_app_card', 'video']

export function ContentEditorPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const fetcher = useCallback(() => (id ? fetchContent(id) : Promise.resolve(null)), [id])
  const record = useAsyncData(`content-${id ?? 'new'}`, fetcher)
  const requested = params.get('type') as ContentType | null

  if (id && record.error && !record.data) {
    return <PageState title="Couldn't open this content" description={record.error} action={<Button onClick={record.reload}>Try again</Button>} />
  }
  if (id && !record.data) return <PageState title="Loading…" description="Opening the editor." />

  return <EditorScreen key={id ?? 'new'} id={id ?? null} record={record.data ?? null} initialType={requested && TYPES.includes(requested) ? requested : 'article'} />
}

interface EditorScreenProps {
  id: string | null
  record: ContentRecord | null
  initialType: ContentType
}

function EditorScreen({ id, record, initialType }: EditorScreenProps) {
  const toast = useToast()
  const navigate = useNavigate()
  const options = useAsyncData('content-options', fetchContentOptions)
  const [form, setForm] = useState<ContentForm>(() => (record ? recordToForm(record) : emptyForm(initialType)))
  const [status, setStatus] = useState<ContentStatus | null>(record?.status ?? null)
  const [savedAt, setSavedAt] = useState<string | null>(record?.updated_at ?? null)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)

  const set = useCallback(<K extends keyof ContentForm>(key: K, value: ContentForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setDirty(true)
  }, [])

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const changeType = (type: ContentType) => {
    if (type === form.type) return
    setForm((current) => ({ ...emptyForm(type), category: current.category, tags: current.tags, visibility: current.visibility, languages: current.languages }))
    setDirty(true)
  }

  /** Saves and returns the item id (creating it the first time). */
  const persist = async (): Promise<string> => {
    const saved = await saveContent(id, formToPayload(form))
    setStatus(saved.status)
    setSavedAt(new Date().toISOString())
    setDirty(false)
    if (!id) navigate(`/content-library/${saved.id}`, { replace: true })
    return saved.id
  }

  const run = async (task: () => Promise<void>, failure: string) => {
    setBusy(true)
    try {
      await task()
    } catch (err) {
      toast({ tone: 'error', title: failure, description: err instanceof Error ? err.message : undefined })
    } finally {
      setBusy(false)
    }
  }

  const save = () =>
    run(async () => {
      await persist()
      toast({ title: 'Draft saved' })
    }, 'Could not save')

  const submit = () =>
    run(async () => {
      if (form.type === 'in_app_card') {
        if (!form.run_from) throw new Error('Set a “Run from” date first.')
        if (form.screens.length === 0) throw new Error('Choose at least one screen.')
      } else if (!form.reviewer_name) {
        throw new Error('Choose a reviewer in the Medical review card first.')
      }
      const itemId = await persist()
      const at = form.type === 'in_app_card' ? new Date(`${form.run_from}T07:00`).toISOString() : undefined
      const changed = await bulkContentAction([itemId], form.type === 'in_app_card' ? 'schedule' : 'send_to_review', at)
      if (changed === 0) throw new Error('This item is already past that step.')
      setStatus(form.type === 'in_app_card' ? 'scheduled' : 'medical_review')
      toast({ title: form.type === 'in_app_card' ? 'Card scheduled' : 'Submitted for medical review' })
      navigate('/content-library')
    }, 'Could not submit')

  const subtitle = status
    ? `${STATUS_BADGE[status].label}${savedAt ? ` · saved ${timeAgo(savedAt)}` : ''}${record?.updated_by ? ` by ${record.updated_by}` : ''}`
    : undefined

  return (
    <>
      <EditorHeader type={form.type} subtitle={subtitle} busy={busy} onSave={save} onSubmit={submit} canSubmit={status !== 'archived' && status !== 'published' && status !== 'scheduled'} />
      <WorkflowSteps status={status} />
      <div className="flex flex-col items-start gap-4 min-[1201px]:flex-row">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
          <TypeTabs value={form.type} onChange={changeType} locked={id !== null} />
          {form.type === 'article' && <ArticleForm form={form} set={set} />}
          {form.type === 'daily_tip' && <TipForm form={form} id={id} set={set} />}
          {form.type === 'in_app_card' && <CardForm form={form} set={set} />}
          {form.type === 'video' && <VideoForm form={form} set={set} />}
        </div>
        <SettingsColumn form={form} options={options.data} set={set} />
      </div>
    </>
  )
}
