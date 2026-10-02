import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAsyncData } from '../../../shared/hooks/useAsyncData'
import { ProhibitInset } from '@phosphor-icons/react'
import { Button, ConfirmDialog, PageState, ReasonDialog, useDisclosure, useToast } from '../../../shared/ui'
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
import { useCanReview } from '../hooks/useCanReview'
import { ScheduleModal } from '../modals/ScheduleModal'
import { bulkContentAction, fetchContent, fetchContentOptions, reviewContent, saveContent } from '../services/content.service'
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
  const { canReview, isSuperAdmin } = useCanReview()
  const approve = useDisclosure()
  const requestChanges = useDisclosure()
  const approvePublish = useDisclosure()
  const publishDraft = useDisclosure()
  const schedule = useDisclosure()

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

  /** Saves pending edits first, runs the review decision, then reloads the status the server decided on. */
  const decide = async (decision: 'approve' | 'approve_publish' | 'request_changes', note?: string) => {
    if (!id) return
    if (dirty) await persist()
    const changed = await reviewContent([id], decision, note)
    if (changed === 0) throw new Error('This item is not waiting for review any more.')
    const fresh = await fetchContent(id)
    setStatus(fresh.status)
    toast({
      title: decision === 'request_changes' ? 'Changes requested' : fresh.status === 'scheduled' ? 'Approved and scheduled' : fresh.status === 'published' ? 'Approved and published' : 'Approved',
      
      description: decision === 'request_changes' ? 'The author sees your note in the review history.' : fresh.status === 'approved' ? 'It can now be scheduled or published.' : undefined,
    })
    navigate('/content-library')
  }

  /** Schedule / publish / re-publish: separate steps after approval (or after archiving). */
  const moveOn = async (action: 'schedule' | 'publish_now' | 'republish', at?: string) => {
    if (!id) return
    const changed = await bulkContentAction([id], action, at)
    if (changed === 0) throw new Error(action === 'republish' ? 'Only archived items can be re-published.' : 'Only approved items can be scheduled or published.')
    const fresh = await fetchContent(id)
    setStatus(fresh.status)
    toast({ title: action === 'schedule' ? 'Scheduled' : fresh.status === 'draft' ? 'Moved back to Draft for review' : 'Published', description: fresh.status === 'draft' ? 'It was never approved, so it needs a review first.' : undefined })
    navigate('/content-library')
  }

  const isCard = form.type === 'in_app_card'
  const lifecycle = id
    ? {
        onSchedule: status === 'approved' || status === 'scheduled' ? schedule.onOpen : undefined,
        onPublishNow: status === 'approved' ? () => run(() => moveOn('publish_now'), 'Could not publish') : undefined,
        onRepublish: status === 'archived' ? () => run(() => moveOn('republish'), 'Could not re-publish') : undefined,
      }
    : undefined

  const inReview = status === 'medical_review'
  const review = canReview && id
    ? {
        canApprove: inReview,
        canRequestChanges: inReview,
        canPublishDraft: isSuperAdmin && (status === 'draft' || status === 'changes_requested') && form.type !== 'in_app_card',
        onApprove: approve.onOpen,
        onApprovePublish: approvePublish.onOpen,
        onRequestChanges: requestChanges.onOpen,
        onPublishDraft: publishDraft.onOpen,
      }
    : undefined

  const subtitle = status
    ? `${STATUS_BADGE[status].label}${savedAt ? ` · saved ${timeAgo(savedAt)}` : ''}${record?.updated_by ? ` by ${record.updated_by}` : ''}`
    : undefined

  return (
    <>
      <EditorHeader type={form.type} subtitle={subtitle} busy={busy} onSave={save} onSubmit={submit} canSubmit={status !== 'archived' && status !== 'published' && status !== 'scheduled' && status !== 'approved'} lifecycle={isCard ? { onRepublish: lifecycle?.onRepublish } : lifecycle} review={review} />
      <WorkflowSteps status={status} />
      <div className="flex flex-col items-start gap-4 min-[1201px]:flex-row">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
          <TypeTabs value={form.type} onChange={changeType} locked={id !== null} />
          {form.type === 'article' && <ArticleForm form={form} set={set} />}
          {form.type === 'daily_tip' && <TipForm form={form} id={id} set={set} />}
          {form.type === 'in_app_card' && <CardForm form={form} set={set} />}
          {form.type === 'video' && <VideoForm form={form} set={set} />}
        </div>
        <SettingsColumn form={form} options={options.data} set={set} reviews={record?.reviews} />
      </div>

      <ConfirmDialog
        open={approve.open}
        onClose={approve.onClose}
        title="Approve?"
        description={form.scheduled_at ? 'It already has a publish time, so it will be scheduled for then.' : 'It is marked Approved. Schedule it or publish it next.'}
        confirmLabel="Approve"
        onConfirm={() => decide('approve')}
      />
      <ConfirmDialog
        open={approvePublish.open}
        onClose={approvePublish.onClose}
        title="Approve and publish?"
        description={form.scheduled_at ? 'It was given a publish time, so it will go live then.' : 'It goes live in the app right away for the audience you picked.'}
        confirmLabel="Approve & publish"
        onConfirm={() => decide('approve_publish')}
      />
      <ScheduleModal key={String(schedule.open)} open={schedule.open} count={1} onClose={schedule.onClose} onConfirm={(at) => moveOn('schedule', at)} />
      <ReasonDialog
        open={requestChanges.open}
        onClose={requestChanges.onClose}
        title="Request changes"
        description="The item goes back to the author with your note."
        reasonLabel="What should change?"
        placeholder="e.g. Add two references for the dosage claim"
        confirmLabel="Send back"
        onConfirm={(note) => decide('request_changes', note)}
      />
      <ReasonDialog
        open={publishDraft.open}
        onClose={publishDraft.onClose}
        icon={<ProhibitInset size={20} />}
        tone="danger"
        title="Publish without a medical review?"
        description="Health content normally needs a medical reviewer. Publishing it yourself is logged with your name and this reason."
        reasonLabel="Why is this published without a review?"
        placeholder="e.g. No reviewer on the team yet; owner sign-off"
        confirmLabel="Publish"
        onConfirm={(note) => decide('approve_publish', note)}
      />
    </>
  )
}
