import { useCallback, useState } from 'react'
import { useUrlFilters } from '../../../shared/hooks/useUrlFilters'
import { ConfirmDialog, useDisclosure, useToast } from '../../../shared/ui'
import { ContentHeader } from '../components/library/ContentHeader'
import { ContentStats } from '../components/library/ContentStats'
import { ContentTable } from '../components/library/ContentTable'
import { ReviewQueueCard } from '../components/library/ReviewQueueCard'
import { TopPerformingCard } from '../components/library/TopPerformingCard'
import { useContentHighlights, useContentList, useContentSummary } from '../hooks/useContentData'
import { ScheduleModal } from '../modals/ScheduleModal'
import { bulkContentAction } from '../services/content.service'
import type { BulkAction, ContentFilters } from '../types'

const KEYS = { tab: 'tab', search: 'q', type: 'type', category: 'category', reviewer: 'reviewer', lang: 'lang' }

const DONE: Record<BulkAction, string> = { send_to_review: 'sent to review', schedule: 'scheduled', archive: 'archived' }

export function ContentLibraryPage() {
  const toast = useToast()
  const { values, page, setFilter, setPage } = useUrlFilters(KEYS, { tab: 'all' })
  const filters: ContentFilters = values
  const summary = useContentSummary()
  const highlights = useContentHighlights()
  const list = useContentList(filters, page)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const schedule = useDisclosure()
  const archive = useDisclosure()

  const clearSelection = useCallback(() => setSelected(new Set()), [])

  const onFilter = useCallback(
    (key: keyof ContentFilters, value: string) => {
      clearSelection()
      setFilter(key, value)
    },
    [clearSelection, setFilter],
  )

  const onPage = (next: number) => {
    clearSelection()
    setPage(next)
  }

  const onSelect = (ids: string[], checked: boolean) =>
    setSelected((current) => {
      const next = new Set(current)
      for (const id of ids) {
        if (checked) next.add(id)
        else next.delete(id)
      }
      return next
    })

  const refresh = () => {
    clearSelection()
    summary.reload()
    highlights.reload()
    list.reload()
  }

  const run = async (action: BulkAction, at?: string) => {
    const ids = [...selected]
    const changed = await bulkContentAction(ids, action, at)
    const skipped = ids.length - changed
    toast({
      tone: changed === 0 ? 'info' : 'success',
      title: changed === 0 ? 'Nothing changed' : `${changed} item${changed === 1 ? '' : 's'} ${DONE[action]}`,
      description: skipped > 0 ? `${skipped} skipped: not in a state that allows this${action === 'send_to_review' ? ', or no reviewer assigned' : ''}.` : undefined,
    })
    refresh()
  }

  const sendToReview = async () => {
    setBusy(true)
    try {
      await run('send_to_review')
    } catch (err) {
      toast({ tone: 'error', title: 'Could not send to review', description: err instanceof Error ? err.message : undefined })
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <ContentHeader />
      <ContentStats data={summary.data} />
      <ContentTable
        summary={summary.data}
        list={list.data}
        loading={list.loading}
        error={list.error}
        filters={filters}
        page={page}
        selected={selected}
        busy={busy}
        onFilter={onFilter}
        onPage={onPage}
        onSelect={onSelect}
        onClearSelection={clearSelection}
        onSendToReview={sendToReview}
        onSchedule={schedule.onOpen}
        onArchive={archive.onOpen}
        onRetry={list.reload}
      />
      <div className="flex flex-col gap-4 min-[1201px]:flex-row">
        <ReviewQueueCard items={highlights.data?.review_queue} />
        <TopPerformingCard items={highlights.data?.top} />
      </div>

      <ScheduleModal key={String(schedule.open)} open={schedule.open} count={selected.size} onClose={schedule.onClose} onConfirm={(at) => run('schedule', at)} />
      <ConfirmDialog
        open={archive.open}
        onClose={archive.onClose}
        tone="danger"
        title={`Archive ${selected.size} item${selected.size === 1 ? '' : 's'}?`}
        description="Archived content is hidden from the app and website. You can still find it under the Archived tab."
        confirmLabel="Archive"
        onConfirm={() => run('archive')}
      />
    </>
  )
}
