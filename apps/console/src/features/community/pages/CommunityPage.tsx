import { useState } from 'react'
import { ConfirmDialog, useDisclosure, useToast } from '../../../shared/ui'
import { CommunityHeader } from '../components/CommunityHeader'
import { CommunityStats } from '../components/CommunityStats'
import { GroupsTable } from '../components/GroupsTable'
import { ModerationQueue } from '../components/ModerationQueue'
import { PostDetailPanel } from '../components/PostDetailPanel'
import { useCommunitySummary, useGroups, usePost, useQueue } from '../hooks/useCommunityData'
import { GuidelinesModal } from '../modals/GuidelinesModal'
import { KeywordRulesModal } from '../modals/KeywordRulesModal'
import { NewGroupModal } from '../modals/NewGroupModal'
import { addNote, resolvePost } from '../services/community.service'
import type { QueueTab, ResolveAction } from '../types'

const DONE: Record<ResolveAction, string> = {
  approve: 'Post approved',
  hide: 'Post hidden',
  hide_support: 'Post hidden, support message queued',
  escalate: 'Escalated to the counsellor team',
  remove: 'Post removed',
}

export function CommunityPage() {
  const toast = useToast()
  const [tab, setTab] = useState<QueueTab>('reported')
  const summary = useCommunitySummary()
  const queue = useQueue(tab)
  const groups = useGroups()
  const [picked, setPicked] = useState<string | null>(null)
  const items = queue.data
  const selected = items && items.length > 0 ? (items.some((i) => i.id === picked) ? picked : items[0]!.id) : null
  const post = usePost(selected)
  const [busy, setBusy] = useState(false)
  const [removal, setRemoval] = useState<{ note: string } | null>(null)
  const guidelines = useDisclosure()
  const keywords = useDisclosure()
  const newGroup = useDisclosure()

  const refresh = () => {
    summary.reload()
    queue.reload()
    groups.reload()
  }

  const resolve = async (action: ResolveAction, note: string) => {
    if (!selected) return
    setBusy(true)
    try {
      await resolvePost(selected, action, note)
      toast({ title: DONE[action] })
      setPicked(null)
      refresh()
    } catch (err) {
      toast({ tone: 'error', title: 'Could not update the post', description: err instanceof Error ? err.message : undefined })
    } finally {
      setBusy(false)
    }
  }

  const saveNote = async (note: string) => {
    if (!selected) return
    try {
      await addNote(selected, note)
      toast({ title: 'Note added' })
      post.reload()
    } catch (err) {
      toast({ tone: 'error', title: 'Could not save the note', description: err instanceof Error ? err.message : undefined })
    }
  }

  return (
    <>
      <CommunityHeader onGuidelines={guidelines.onOpen} onKeywords={keywords.onOpen} onNewGroup={newGroup.onOpen} />
      <CommunityStats data={summary.data} />

      <div className="flex flex-col items-stretch gap-4 min-[1201px]:flex-row min-[1201px]:items-start">
        <ModerationQueue
          summary={summary.data}
          tab={tab}
          items={items}
          loading={queue.loading}
          error={queue.error}
          selected={selected}
          onTab={(next) => {
            setTab(next)
            setPicked(null)
          }}
          onSelect={setPicked}
          onRetry={queue.reload}
        />
        <PostDetailPanel
          post={selected ? post.data : null}
          loading={post.loading && !!selected}
          busy={busy}
          onResolve={(action, note) => (action === 'remove' ? setRemoval({ note }) : void resolve(action, note))}
          onAddNote={saveNote}
        />
      </div>

      <GroupsTable data={groups.data} />

      <GuidelinesModal open={guidelines.open} onClose={guidelines.onClose} />
      <KeywordRulesModal open={keywords.open} onClose={keywords.onClose} />
      <NewGroupModal open={newGroup.open} onClose={newGroup.onClose} onCreated={groups.reload} />
      <ConfirmDialog
        open={removal !== null}
        onClose={() => setRemoval(null)}
        tone="danger"
        title="Remove this post?"
        description="The post is removed from the app for everyone. Use “Hide” instead if the author might appeal."
        confirmLabel="Remove post"
        onConfirm={() => resolve('remove', removal?.note ?? '')}
      />
    </>
  )
}
