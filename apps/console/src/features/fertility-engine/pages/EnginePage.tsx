import { useState } from 'react'
import { Button, PageState, useDisclosure } from '../../../shared/ui'
import { EngineHeader } from '../components/EngineHeader'
import { ModeOverridesCard } from '../components/ModeOverridesCard'
import { PipelineCard } from '../components/PipelineCard'
import { StatusTable } from '../components/StatusTable'
import { VersionBanner } from '../components/VersionBanner'
import { WeightsCard } from '../components/WeightsCard'
import { useEngineState } from '../hooks/useEngineData'
import { canEditNow, draftVersion } from '../lib'
import { ReleaseModal } from '../modals/ReleaseModal'
import { StatusWizardModal } from '../modals/status-wizard/StatusWizardModal'
import { VersionHistoryModal } from '../modals/VersionHistoryModal'
import type { StatusDef } from '../types'

export function EnginePage() {
  const engine = useEngineState()
  const state = engine.data
  const history = useDisclosure()
  const release = useDisclosure()
  const wizard = useDisclosure()
  const [editing, setEditing] = useState<StatusDef | null>(null)
  const [wizardRun, setWizardRun] = useState(0)

  if (engine.error && !state) {
    return <PageState title="The fertility engine is not available" description={engine.error} action={<Button variant="outline" onClick={engine.reload}>Retry</Button>} />
  }

  const config = state?.subject?.config
  const canEdit = !!state && canEditNow(state)
  const openWizard = (status: StatusDef | null) => {
    setEditing(status)
    setWizardRun((n) => n + 1)
    wizard.onOpen()
  }

  return (
    <>
      <EngineHeader state={state} onHistory={history.onOpen} onRelease={release.onOpen} />
      <VersionBanner state={state} />
      <PipelineCard pipeline={config?.pipeline} />
      <StatusTable statuses={config?.statuses} usersNow={state?.users_now} canEdit={canEdit} onAdd={() => openWizard(null)} onEdit={openWizard} />
      <div className="flex flex-col items-stretch gap-4 min-[1201px]:flex-row min-[1201px]:items-start">
        <div className="min-[1201px]:flex-1">
          {config && <WeightsCard key={`${state.subject!.id}|${state.subject!.updated_at}`} weights={config.modes.ttc.weights} canEdit={canEdit} onSaved={engine.reload} />}
        </div>
        <div className="min-[1201px]:flex-1">
          <ModeOverridesCard config={config} approvals={state?.approvals ?? []} />
        </div>
      </div>

      <VersionHistoryModal open={history.open} onClose={history.onClose} state={state} />
      {state?.subject && wizardRun > 0 && (
        <StatusWizardModal key={wizardRun} open={wizard.open} onClose={wizard.onClose} config={state.subject.config} editing={editing} draft={draftVersion(state)} onSaved={engine.reload} />
      )}
      {state?.subject && release.open && <ReleaseModal key={state.subject.updated_at} open={release.open} onClose={release.onClose} state={state} onDone={engine.reload} />}
    </>
  )
}
