import { Columns, Flask, FloppyDisk } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button, PageState, useDisclosure, useToast } from '../../../shared/ui'
import { ChangeHistory, ModePerformance } from '../components/modes/ModeInsights'
import { ModeBanner } from '../components/modes/ModeBanner'
import { ModeParams } from '../components/modes/ModeParams'
import { ModeTabs } from '../components/modes/ModeTabs'
import { ModeWeights } from '../components/modes/ModeWeights'
import { StatusOverrides } from '../components/modes/StatusOverrides'
import { ToggleCard } from '../components/modes/ToggleCard'
import { modeFromSlug } from '../engine/fields'
import { useEngineState } from '../hooks/useEngineData'
import { useModeEdits } from '../hooks/useModeEdits'
import { canEditNow, draftVersion, weightSum } from '../lib'
import { CompareModesModal } from '../modals/CompareModesModal'
import { OverrideEditModal } from '../modals/OverrideEditModal'
import { patchDraft } from '../services/engine.service'
import type { EngineState, ModeKey, StatusOverride } from '../types'

export function ModesPage() {
  const { mode: slug } = useParams()
  const mode = modeFromSlug(slug)
  const engine = useEngineState()
  if (engine.error && !engine.data) return <PageState title="The fertility engine is not available" description={engine.error} action={<Button variant="outline" onClick={engine.reload}>Retry</Button>} />
  if (!engine.data?.subject) return <PageState title={engine.loading ? 'Loading…' : 'No engine version yet'} />
  const state = engine.data
  return <ModeEditor key={`${mode}|${state.subject!.id}|${state.subject!.updated_at}`} mode={mode} state={state} onSaved={engine.reload} />
}

function ModeEditor({ mode, state, onSaved }: { mode: ModeKey; state: EngineState; onSaved: () => void }) {
  const toast = useToast()
  const config = state.subject!.config
  const cfg = config.modes[mode]
  const base = config.modes.ttc
  const edits = useModeEdits(mode, cfg)
  const compare = useDisclosure()
  const [override, setOverride] = useState<StatusOverride | null>(null)
  const [saving, setSaving] = useState(false)
  const canEdit = canEditNow(state)
  const draft = draftVersion(state)
  const valid = Math.abs(weightSum(edits.weights) - 1) < 0.005
  const events = state.events.filter((e) => e.mode === mode).slice(0, 3)

  const save = async () => {
    setSaving(true)
    try {
      await patchDraft(edits.ops(), `${cfg.meta.label}: rule values changed`, mode)
      toast({ title: 'Saved to draft', description: `Changes are in ${draft}.` })
      onSaved()
    } catch (err) {
      toast({ tone: 'error', title: 'Could not save to draft', description: err instanceof Error ? err.message : undefined })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-26 font-extrabold">
            <Link to="/fertility-engine" className="text-ink-muted hover:text-primary">Fertility engine</Link> / Mode overrides
          </h1>
          <p className="text-14 text-ink-muted">How each tracking mode changes the default (TTC) rule set.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button variant="outline" onClick={compare.onOpen} leadingIcon={<Columns size={16} />}>Compare modes</Button>
          <Link to="/fertility-engine/simulator" className="inline-flex items-center justify-center gap-2 rounded-control border border-border bg-card px-3.5 py-[9px] text-13 font-bold whitespace-nowrap">
            <Flask size={16} /> Open simulator
          </Link>
          {edits.dirty && <Button variant="outline" onClick={edits.reset} disabled={saving}>Reset</Button>}
          <Button onClick={save} disabled={!canEdit || !edits.dirty || !valid || saving} title={!valid ? 'Signal weights must sum to 1.00' : undefined} leadingIcon={<FloppyDisk size={16} color="#fff" />}>
            {saving ? 'Saving…' : `Save to draft ${draft}`}
          </Button>
        </div>
      </div>

      <ModeTabs active={mode} users={state.mode_users} />
      <ModeBanner state={state} mode={mode} />

      <div className="grid items-start gap-4 min-[1201px]:grid-cols-2">
        <ModeWeights mode={mode} color={cfg.meta.color} weights={edits.weights} baseline={base.weights} canEdit={canEdit} onChange={edits.setWeight} />
        <ModeParams params={cfg.params} baseline={base.params} color={cfg.meta.color} isBaseline={mode === 'ttc'} canEdit={canEdit} value={edits.paramValue} onChange={edits.setParam} />
      </div>

      <StatusOverrides mode={cfg} statuses={config.statuses} canEdit={canEdit} onEdit={setOverride} />

      <div className="grid items-start gap-4 min-[1201px]:grid-cols-2">
        <ToggleCard title="Notifications & tone" items={cfg.notifications} canEdit={canEdit} value={(k) => edits.toggleValue('notifications', k)} onChange={(k, on) => edits.setToggle('notifications', k, on)} />
        <ToggleCard title="Content & features" items={cfg.features} canEdit={canEdit} value={(k) => edits.toggleValue('features', k)} onChange={(k, on) => edits.setToggle('features', k, on)} />
      </div>

      <div className="grid items-start gap-4 min-[1201px]:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <ModePerformance metrics={state.metrics[`perf:${mode}`] ?? []} />
        <ChangeHistory events={events} />
      </div>

      <CompareModesModal open={compare.open} onClose={compare.onClose} config={config} />
      {override && (
        <OverrideEditModal
          key={override.status}
          open
          onClose={() => setOverride(null)}
          mode={mode}
          modeLabel={cfg.meta.label}
          override={override}
          status={config.statuses.find((s) => s.key === override.status)}
          draft={draft}
          onSaved={onSaved}
        />
      )}
    </>
  )
}
