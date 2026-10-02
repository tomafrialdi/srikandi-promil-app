import { CalendarCheck, Eye, FloppyDisk, PaperPlaneTilt, Pause, Play, PaperPlane } from '@phosphor-icons/react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAsyncData } from '../../../shared/hooks/useAsyncData'
import { timeAgo } from '../../../shared/lib/format'
import { Button, Notice, PageState, Tooltip, TooltipBody, useToast } from '../../../shared/ui'
import { AudienceSection } from '../components/editor/AudienceSection'
import { CampaignSection } from '../components/editor/CampaignSection'
import { DeliverySection } from '../components/editor/DeliverySection'
import { MessageSection } from '../components/editor/MessageSection'
import { PreviewColumn } from '../components/editor/PreviewColumn'
import { emptyCampaign } from '../config/editor'
import { STATUS_BADGE } from '../config/labels'
import { formToPayload, recordToForm } from '../lib/form-mapping'
import { campaignAction, fetchCampaign, fetchReach, saveCampaign } from '../services/notifications.service'
import type { CampaignForm, CampaignRecord, NotificationStatus } from '../types'

export function NotificationEditorPage() {
  const { id } = useParams()
  const fetcher = useCallback(() => (id ? fetchCampaign(id) : Promise.resolve(null)), [id])
  const record = useAsyncData(`campaign-${id ?? 'new'}`, fetcher)

  if (id && record.error && !record.data) {
    return <PageState title="Couldn't open this campaign" description={record.error} action={<Button onClick={record.reload}>Try again</Button>} />
  }
  if (id && !record.data) return <PageState title="Loading…" description="Opening the campaign." />
  return <EditorScreen key={id ?? 'new'} id={id ?? null} record={record.data ?? null} />
}

const SUBMIT_LABEL = { now: 'Send campaign', scheduled: 'Schedule campaign', trigger: 'Activate trigger' } as const

function EditorScreen({ id, record }: { id: string | null; record: CampaignRecord | null }) {
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState<CampaignForm>(() => (record ? recordToForm(record) : emptyCampaign()))
  const [status, setStatus] = useState<NotificationStatus | null>(record?.status ?? null)
  const [savedAt, setSavedAt] = useState<string | null>(record?.updated_at ?? null)
  const [dirty, setDirty] = useState(false)
  const [busy, setBusy] = useState(false)

  const reachFetcher = useCallback(() => fetchReach(form.rules), [form.rules])
  const reach = useAsyncData(`reach-${JSON.stringify(form.rules)}`, reachFetcher)
  const locked = status === 'sending' || status === 'sent'

  const set = useCallback(<K extends keyof CampaignForm>(key: K, value: CampaignForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }))
    setDirty(true)
  }, [])

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const persist = async (): Promise<string> => {
    const saved = await saveCampaign(id, formToPayload(form))
    setStatus(saved.status)
    setSavedAt(new Date().toISOString())
    setDirty(false)
    if (!id) navigate(`/notifications/${saved.id}`, { replace: true })
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

  const save = () => run(async () => { await persist(); toast({ title: 'Draft saved' }) }, 'Could not save')

  const submit = () =>
    run(async () => {
      const itemId = await persist()
      const next = await campaignAction(itemId, status === 'failed' ? 'resend' : 'schedule')
      toast({ title: next === 'active' ? 'Trigger activated' : 'Campaign queued', description: next === 'active' ? "It is checked at each user's local send time." : 'Delivered at the next dispatcher run (about every 5 minutes).' })
      navigate('/notifications')
    }, 'Could not schedule')

  const toggleActive = (action: 'pause' | 'resume') =>
    run(async () => {
      if (!id) return
      setStatus(await campaignAction(id, action))
      toast({ title: action === 'pause' ? 'Trigger paused' : 'Trigger resumed' })
    }, 'Could not change the status')

  const subtitle = status
    ? `${STATUS_BADGE[status].label}${savedAt ? ` · saved ${timeAgo(savedAt)}` : ''}${record?.updated_by ? ` by ${record.updated_by}` : ''}`
    : 'Campaigns reach users by push, in-app card or email.'

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-26 font-extrabold">{id ? (form.name || 'Campaign') : 'New notification'}</h1>
          <p className="text-14 text-ink-muted">{subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {status === 'active' && <Button variant="outline" onClick={() => toggleActive('pause')} disabled={busy} leadingIcon={<Pause size={16} />}>Pause</Button>}
          {status === 'paused' && <Button variant="outline" onClick={() => toggleActive('resume')} disabled={busy} leadingIcon={<Play size={16} />}>Resume</Button>}
          <Tooltip placement="bottom" align="end" content={<TooltipBody title="Test sends need the push sender service" />}>
            <Button variant="outline" disabled leadingIcon={<PaperPlane size={16} />}>Send test to me</Button>
          </Tooltip>
          <Button variant="outline" onClick={save} disabled={busy || locked} leadingIcon={<FloppyDisk size={16} />}>Save draft</Button>
          <Button onClick={submit} disabled={busy || locked || status === 'active' || status === 'paused'} leadingIcon={form.delivery === 'now' || status === 'failed' ? <PaperPlaneTilt size={16} color="#fff" /> : <CalendarCheck size={16} color="#fff" />}>
            {status === 'failed' ? 'Fix & resend' : SUBMIT_LABEL[form.delivery]}
          </Button>
        </div>
      </div>

      {locked && (
        <Notice icon={<Eye size={16} />}>This campaign has been sent, so it is read-only. Duplicate it by creating a new notification.</Notice>
      )}

      <div className="flex flex-col items-start gap-4 min-[1201px]:flex-row">
        <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
          <CampaignSection form={form} set={set} disabled={locked} />
          <AudienceSection form={form} set={set} reach={reach.data} disabled={locked} />
          <MessageSection form={form} set={set} disabled={locked} />
          <DeliverySection form={form} set={set} disabled={locked} />
        </div>
        <PreviewColumn form={form} reach={reach.data} />
      </div>
    </>
  )
}
