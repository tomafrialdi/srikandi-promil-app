import { useState } from 'react'
import { PageState, useToast } from '../../../shared/ui'
import { Button } from '../../../shared/ui'
import { downloadCsv } from '../../../shared/lib/csv'
import { InviteAdminModal } from '../../users/modals/invite-admin/InviteAdminModal'
import { AuditLogCard } from '../components/AuditLogCard'
import { PermissionMatrix } from '../components/PermissionMatrix'
import { RolesHeader } from '../components/RolesHeader'
import { TeamMembersCard } from '../components/TeamMembersCard'
import { actionText } from '../config/labels'
import { useRolesOverview } from '../hooks/useRolesData'
import { SecuritySettingsModal } from '../modals/security/SecuritySettingsModal'
import { fetchAuditExport } from '../services/roles.service'

export function RolesPage() {
  const toast = useToast()
  const overview = useRolesOverview()
  const data = overview.data
  const [invite, setInvite] = useState(false)
  /** 0 = never opened; each opening gets a fresh modal (and a fresh fetch) via its key. */
  const [securityRun, setSecurityRun] = useState(0)
  const [securityOpen, setSecurityOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const exportAudit = async () => {
    setExporting(true)
    try {
      const rows = await fetchAuditExport()
      downloadCsv(
        `audit-log-${new Date().toISOString().slice(0, 10)}.csv`,
        ['Time', 'Actor', 'Action', 'Target', 'IP'],
        rows.map((r) => [r.at, r.actor ?? 'System', actionText(r), r.resource, r.ip]),
      )
      toast({ title: `Exported ${rows.length} audit entries` })
      overview.reload()
    } catch (err) {
      toast({ tone: 'error', title: 'Could not export the audit log', description: err instanceof Error ? err.message : undefined })
    } finally {
      setExporting(false)
    }
  }

  if (overview.error && !data) {
    return (
      <PageState
        title="Roles & access is not available"
        description={overview.error}
        action={<Button variant="outline" onClick={overview.reload}>Retry</Button>}
      />
    )
  }

  return (
    <>
      <RolesHeader
        canInvite={data?.can_invite ?? false}
        onSecurity={() => {
          setSecurityRun((n) => n + 1)
          setSecurityOpen(true)
        }}
        onInvite={() => setInvite(true)}
      />
      <PermissionMatrix data={data} />
      <div className="flex flex-col items-stretch gap-4 min-[1201px]:flex-row min-[1201px]:items-start">
        <TeamMembersCard data={data} />
        <AuditLogCard rows={data?.audit} exporting={exporting} onExport={exportAudit} />
      </div>

      {securityRun > 0 && <SecuritySettingsModal key={securityRun} open={securityOpen} onClose={() => setSecurityOpen(false)} />}
      <InviteAdminModal
        open={invite}
        onClose={() => setInvite(false)}
        onInvited={(count) => {
          toast({ title: `${count} invitation${count === 1 ? '' : 's'} sent` })
          overview.reload()
        }}
      />
    </>
  )
}
