import { GitBranch } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { PageState, ReasonDialog, useDisclosure, useToast } from '../../../shared/ui'
import { useUrlFilters } from '../../../shared/hooks/useUrlFilters'
import { SupportHeader } from '../components/SupportHeader'
import { SupportStats } from '../components/SupportStats'
import { TicketList, type TicketFilterKey } from '../components/TicketList'
import { TicketThread } from '../components/TicketThread'
import { useAgents, useMacros, useSupportSummary, useTicket, useTickets } from '../hooks/useSupportData'
import { MacrosModal } from '../modals/MacrosModal'
import { NewTicketModal } from '../modals/NewTicketModal'
import { escalateTicket } from '../services/support.service'
import type { TicketFilters } from '../types'

const KEYS = { tab: 'tab', search: 'q', status: 'status' } as const
const POLL_MS = 30_000

export function SupportPage() {
  const toast = useToast()
  const { values, setFilter } = useUrlFilters<TicketFilterKey>(KEYS, { tab: 'mine', status: 'open' })
  const filters: TicketFilters = values
  const summary = useSupportSummary()
  const agents = useAgents()
  const macros = useMacros()
  const list = useTickets(filters)
  const [picked, setPicked] = useState<string | null>(null)
  const rows = list.data?.rows
  const selected = rows && rows.length > 0 ? (rows.some((r) => r.id === picked) ? picked : rows[0]!.id) : null
  const ticket = useTicket(selected)
  const newTicket = useDisclosure()
  const macrosModal = useDisclosure()
  const escalate = useDisclosure()
  const [newRun, setNewRun] = useState(0)

  const refresh = () => {
    summary.reload()
    list.reload()
    ticket.reload()
  }

  // New customer messages arrive from the app and WhatsApp: refresh quietly while the tab is visible.
  const reloadAll = useRef(refresh)
  useEffect(() => {
    reloadAll.current = refresh
  })
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') reloadAll.current()
    }, POLL_MS)
    return () => window.clearInterval(id)
  }, [])

  if (summary.error && !summary.data) return <PageState title="Support tickets are not available" description={summary.error} />
  const t = ticket.data
  const canAct = summary.data?.can_act ?? false

  return (
    <>
      <SupportHeader canAct={canAct} onMacros={macrosModal.onOpen} onNew={() => { setNewRun((n) => n + 1); newTicket.onOpen() }} />
      <SupportStats data={summary.data} />
      <div className="flex flex-col items-stretch gap-4 min-[1201px]:flex-row min-[1201px]:items-start">
        <div className="min-w-0 min-[1201px]:w-[430px] min-[1201px]:flex-none">
          <TicketList summary={summary.data} list={list.data} loading={list.loading} error={list.error} filters={filters} selected={selected} onFilter={setFilter} onSelect={setPicked} onRetry={list.reload} />
        </div>
        <div className="min-w-0 min-[1201px]:flex-1">
          {t ? (
            <TicketThread ticket={t} summary={summary.data} agents={agents.data ?? []} macros={macros.data ?? []} onChanged={refresh} onEscalate={escalate.onOpen} />
          ) : (
            <PageState title={ticket.error ?? (selected ? 'Loading…' : 'Select a ticket')} />
          )}
        </div>
      </div>

      {newRun > 0 && <NewTicketModal key={newRun} open={newTicket.open} onClose={newTicket.onClose} onCreated={(id) => { setPicked(id); setFilter('tab', 'all'); refresh() }} />}
      <MacrosModal open={macrosModal.open} onClose={macrosModal.onClose} macros={macros.data ?? []} canEdit={canAct} onChanged={macros.reload} />
      <ReasonDialog
        open={escalate.open}
        onClose={escalate.onClose}
        icon={<GitBranch size={20} />}
        title="Escalate to the engine team?"
        description="The ticket is shared with the engine engineers, who can reply and resolve it. Explain what they need to look at."
        confirmLabel="Escalate"
        reasonLabel="What should the engine team check?"
        placeholder="e.g. LH scanner reads a clear positive strip as negative on iOS 2.4.1"
        onConfirm={async (reason) => {
          if (!t) return
          await escalateTicket(t.id, reason)
          toast({ title: 'Escalated to the engine team', description: `#TCK-${t.number}` })
          refresh()
        }}
      />
    </>
  )
}
