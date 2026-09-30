import { Crown, ProhibitInset } from '@phosphor-icons/react'
import { useCallback, useState } from 'react'
import { downloadCsv } from '../../../shared/lib/csv'
import { ReasonDialog, useDisclosure, useToast } from '../../../shared/ui'
import { logEvent } from '../../auth/services/auth.service'
import { MiniStats } from '../components/list/MiniStats'
import { UsersHeader } from '../components/list/UsersHeader'
import { UsersTable } from '../components/list/UsersTable'
import { useUsersFilters } from '../hooks/useUsersFilters'
import { useUsersList, useUsersSummary } from '../hooks/useUsersData'
import { InviteAdminModal } from '../modals/invite-admin/InviteAdminModal'
import { fetchUsersList, grantPlus, setUsersStatus } from '../services/users.service'


export function UsersPage() {
  const toast = useToast()
  const { filters, page, setFilter, setPage } = useUsersFilters()
  const summary = useUsersSummary()
  const list = useUsersList(filters, page)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [exporting, setExporting] = useState(false)
  const grant = useDisclosure()
  const suspend = useDisclosure()
  const invite = useDisclosure()

  const clearSelection = useCallback(() => setSelected(new Set()), [])

  const onFilter = useCallback(
    (key: 'tab' | 'search' | 'plan' | 'mode' | 'city' | 'status', value: string) => {
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
    list.reload()
  }

  const exportCsv = async () => {
    setExporting(true)
    try {
      const all = await fetchUsersList(filters, 1, 5000)
      downloadCsv(
        `srikandi-users-${new Date().toISOString().slice(0, 10)}.csv`,
        ['ID', 'Name', 'Email', 'City', 'Plan', 'Mode', 'Phase', 'Logs (7d)', 'Joined', 'Last active', 'Status'],
        all.rows.map((r) => [r.ref, r.name, r.email, r.city, r.plan, r.mode, r.phase, r.logs_7d, r.joined, r.last_active_at, r.status]),
      )
      void logEvent('users.export', 'users', { rows: all.rows.length }).catch(() => undefined)
      toast({ title: 'Export ready', description: `${all.rows.length} users exported.` })
    } catch (err) {
      toast({ tone: 'error', title: 'Export failed', description: err instanceof Error ? err.message : undefined })
    } finally {
      setExporting(false)
    }
  }

  const ids = [...selected]

  return (
    <>
      <UsersHeader onExport={exportCsv} exporting={exporting} onInvite={invite.onOpen} />
      <MiniStats data={summary.data?.mini} />
      <UsersTable
        summary={summary.data}
        list={list.data}
        loading={list.loading}
        error={list.error}
        filters={filters}
        page={page}
        selected={selected}
        onFilter={onFilter}
        onPage={onPage}
        onSelect={onSelect}
        onClearSelection={clearSelection}
        onGrantPlus={grant.onOpen}
        onSuspend={suspend.onOpen}
        onRetry={list.reload}
      />

      <ReasonDialog
        open={grant.open}
        onClose={grant.onClose}
        icon={<Crown size={20} />}
        title={`Grant Plus to ${ids.length} user${ids.length === 1 ? '' : 's'}`}
        description="Free and trial users get a one-month Plus plan. Paid users are skipped. This is logged."
        confirmLabel="Grant Plus"
        onConfirm={async (reason) => {
          const changed = await grantPlus(ids, reason)
          toast({ title: 'Plus granted', description: `${changed} user${changed === 1 ? '' : 's'} upgraded.` })
          refresh()
        }}
      />
      <ReasonDialog
        open={suspend.open}
        onClose={suspend.onClose}
        icon={<ProhibitInset size={20} />}
        title={`Suspend ${ids.length} user${ids.length === 1 ? '' : 's'}`}
        description="Suspended users cannot sign in to the app. You can reactivate them from their profile."
        confirmLabel="Suspend"
        tone="danger"
        onConfirm={async (reason) => {
          const changed = await setUsersStatus(ids, 'suspended', reason)
          toast({ title: 'Users suspended', description: `${changed} account${changed === 1 ? '' : 's'} suspended.` })
          refresh()
        }}
      />
      <InviteAdminModal
        open={invite.open}
        onClose={invite.onClose}
        onInvited={(count) => toast({ title: 'Invitations recorded', description: `${count} invitation${count === 1 ? '' : 's'} created.` })}
      />
    </>
  )
}
