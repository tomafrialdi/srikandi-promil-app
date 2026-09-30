import { ProhibitInset, Trash, ArrowCounterClockwise } from '@phosphor-icons/react'
import { useCallback, useState } from 'react'
import { downloadCsv } from '../../../shared/lib/csv'
import { ReasonDialog, useDisclosure, useToast } from '../../../shared/ui'
import { useUrlFilters } from '../../../shared/hooks/useUrlFilters'
import { logEvent } from '../../auth/services/auth.service'
import { InviteAdminModal } from '../../users/modals/invite-admin/InviteAdminModal'
import { MembersHeader } from '../components/members/MembersHeader'
import type { MemberFilterKey } from '../components/members/MembersFilterBar'
import { MembersMiniStats } from '../components/members/MembersMiniStats'
import { MembersTable } from '../components/members/MembersTable'
import { TFA } from '../config/members'
import { useMembersList, useMembersSummary, useRoleCatalog } from '../hooks/useRolesData'
import { EditMemberModal } from '../modals/EditMemberModal'
import { deleteMember, fetchMembersList, setMemberActive } from '../services/roles.service'
import type { MemberRow, MembersFilters } from '../types'

const FILTER_KEYS = { tab: 'tab', search: 'q', role: 'role', department: 'dept', tfa: 'tfa' } as const

export function MembersPage() {
  const toast = useToast()
  const { values, page, setFilter, setPage } = useUrlFilters<MemberFilterKey>(FILTER_KEYS, { tab: 'all' })
  const filters: MembersFilters = values
  const summary = useMembersSummary()
  const catalog = useRoleCatalog()
  const list = useMembersList(filters, page)
  const invite = useDisclosure()
  const [exporting, setExporting] = useState(false)
  const [editing, setEditing] = useState<MemberRow | null>(null)
  const [toggling, setToggling] = useState<MemberRow | null>(null)
  const [removing, setRemoving] = useState<MemberRow | null>(null)

  const refresh = () => {
    summary.reload()
    list.reload()
  }

  const onFilter = useCallback((key: MemberFilterKey, value: string) => setFilter(key, value), [setFilter])

  const exportCsv = async () => {
    setExporting(true)
    try {
      const all = await fetchMembersList(filters, 1, 5000)
      downloadCsv(
        `srikandi-team-${new Date().toISOString().slice(0, 10)}.csv`,
        ['Name', 'Email', 'Role', 'Department', 'Job title', '2FA', 'Status', 'Joined', 'Last active'],
        all.rows.map((m) => [m.name, m.email, m.role_label, m.department, m.job_title, TFA[m.tfa].label, m.status, m.joined, m.last_seen]),
      )
      void logEvent('members.export', 'admin_profiles', { rows: all.rows.length }).catch(() => undefined)
      toast({ title: 'Export ready', description: `${all.rows.length} team members exported.` })
    } catch (err) {
      toast({ tone: 'error', title: 'Export failed', description: err instanceof Error ? err.message : undefined })
    } finally {
      setExporting(false)
    }
  }

  const suspending = toggling?.status === 'active'
  // Keep the dialog copy while it animates out.
  const target = toggling ?? removing

  return (
    <>
      <MembersHeader canInvite={summary.data?.can_manage ?? false} exporting={exporting} onExport={exportCsv} onInvite={invite.onOpen} />
      <MembersMiniStats data={summary.data?.mini} />
      <MembersTable
        summary={summary.data}
        roles={catalog.data?.roles ?? []}
        list={list.data}
        loading={list.loading}
        error={list.error}
        filters={filters}
        page={page}
        onFilter={onFilter}
        onPage={setPage}
        onEdit={setEditing}
        onToggleActive={setToggling}
        onRemove={setRemoving}
        onRetry={list.reload}
      />

      <EditMemberModal
        key={editing?.id ?? 'none'}
        member={editing}
        catalog={catalog.data}
        onClose={() => setEditing(null)}
        onSaved={refresh}
        onToggleActive={(m) => {
          setEditing(null)
          setToggling(m)
        }}
        onRemove={(m) => {
          setEditing(null)
          setRemoving(m)
        }}
      />
      <ReasonDialog
        open={toggling !== null}
        onClose={() => setToggling(null)}
        icon={suspending ? <ProhibitInset size={20} /> : <ArrowCounterClockwise size={20} />}
        title={`${suspending ? 'Suspend' : 'Reactivate'} ${target?.name ?? 'member'}`}
        description={
          suspending
            ? 'They are signed out everywhere and cannot open the console until reactivated. This is logged.'
            : 'They can sign in to the console again with their existing 2FA. This is logged.'
        }
        confirmLabel={suspending ? 'Suspend' : 'Reactivate'}
        tone={suspending ? 'danger' : 'primary'}
        onConfirm={async (reason) => {
          if (!toggling) return
          await setMemberActive(toggling.id, !suspending, reason)
          toast({ title: suspending ? 'Member suspended' : 'Member reactivated', description: toggling.name })
          refresh()
        }}
      />
      <ReasonDialog
        open={removing !== null}
        onClose={() => setRemoving(null)}
        icon={<Trash size={20} />}
        title={`Remove ${target?.name ?? 'member'}`}
        description="Removes their console access and ends all their sessions. Their past actions stay in the audit log. To give access back you have to invite them again."
        confirmLabel="Remove member"
        tone="danger"
        onConfirm={async (reason) => {
          if (!removing) return
          await deleteMember(removing.id, reason)
          toast({ title: 'Member removed', description: removing.name })
          refresh()
        }}
      />
      <InviteAdminModal
        open={invite.open}
        onClose={invite.onClose}
        onInvited={(count) => {
          toast({ title: `${count} invitation${count === 1 ? '' : 's'} sent` })
          summary.reload()
        }}
      />
    </>
  )
}
