import { Play, UserFocus } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, ConfirmDialog, PageState, SelectField, useToast } from '../../../shared/ui'
import { CanaryMonitor } from '../components/sim/CanaryMonitor'
import { GoldenSuite } from '../components/sim/GoldenSuite'
import { RunResult } from '../components/sim/RunResult'
import { SignalGrid } from '../components/sim/SignalGrid'
import { runSuite, suiteSummary } from '../engine/golden'
import { simulate } from '../engine/simulate'
import { useEngineState, useGoldenCases } from '../hooks/useEngineData'
import { releaseVersion } from '../services/engine.service'
import type { EngineConfig, EngineState, EngineVersion, GoldenCase, ModeKey, Signals } from '../types'

const SIM_MODES: Array<{ value: ModeKey; label: string }> = [
  { value: 'ttc', label: 'TTC' },
  { value: 'pcos', label: 'PCOS' },
  { value: 'after_loss', label: 'After loss' },
]

export function SimulatorPage() {
  const engine = useEngineState()
  const golden = useGoldenCases()
  if (engine.error && !engine.data) return <PageState title="The simulator is not available" description={engine.error} action={<Button variant="outline" onClick={engine.reload}>Retry</Button>} />
  if (!engine.data?.subject || !golden.data) return <PageState title={engine.error || golden.error ? 'Could not load the simulator' : 'Loading…'} description={engine.error ?? golden.error} />
  return <Simulator state={engine.data} cases={golden.data} onReload={engine.reload} />
}

interface Option {
  id: string
  label: string
  version: EngineVersion
  config: EngineConfig
}

function Simulator({ state, cases, onReload }: { state: EngineState; cases: GoldenCase[]; onReload: () => void }) {
  const toast = useToast()
  const subject = state.subject!
  const options: Option[] = [state.live ?? (subject.status === 'live' ? subject : null), subject]
    .filter((v): v is NonNullable<typeof v> => v != null)
    .filter((v, i, arr) => arr.findIndex((x) => x.id === v.id) === i)
    .map((v) => ({ id: v.id, label: `${v.version} (${v.status === 'in_review' ? 'in review' : v.status})`, version: v, config: v.config! }))
  const live = options.find((o) => o.version.status === 'live') ?? options[0]!
  const [aId, setAId] = useState(live.id)
  const [bId, setBId] = useState(options[options.length - 1]!.id)
  const a = options.find((o) => o.id === aId) ?? live
  const b = options.find((o) => o.id === bId) ?? live

  const first = cases.find((c) => c.key === 'pcos_long_cycle_017') ?? cases[0]!
  const [caseKey, setCaseKey] = useState(first.key)
  const [mode, setMode] = useState<ModeKey>(first.mode)
  const [signals, setSignals] = useState<Signals>(first.signals)
  const [edited, setEdited] = useState(false)
  const [run, setRun] = useState(0)
  const [confirm, setConfirm] = useState<'rollback' | 'expand' | null>(null)
  const current = cases.find((c) => c.key === caseKey)

  const loadCase = (key: string) => {
    const c = cases.find((x) => x.key === key)
    if (!c) return
    setCaseKey(key)
    setMode(c.mode)
    setSignals(c.signals)
    setEdited(false)
  }

  const truth = edited ? undefined : current?.truth_ov
  const ra = useMemo(() => simulate(a.config, mode, signals, truth), [a.config, mode, signals, truth])
  const rb = useMemo(() => simulate(b.config, mode, signals, truth), [b.config, mode, signals, truth])
  // `run` re-runs the suite on demand; it is otherwise recomputed whenever the versions change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const results = useMemo(() => runSuite(cases, a.config, b.config), [cases, a.config, b.config, run])
  const canary = state.versions.find((v) => v.status === 'canary')

  const runSuiteNow = () => {
    setRun((n) => n + 1)
    const s = suiteSummary(runSuite(cases, a.config, b.config))
    toast({ title: 'Test suite finished', description: `${s.pass} / ${s.total} cases pass on ${b.version.version}${s.failed ? ` · ${s.failed} regression${s.failed === 1 ? '' : 's'}` : ''}.` })
  }

  const versionOptions = options.map((o) => ({ value: o.id, label: o.label }))
  const pill = 'flex items-center gap-2 rounded-control border border-border bg-card pl-3.5 text-13'

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-26 font-extrabold">
            <Link to="/fertility-engine" className="text-ink-muted hover:text-primary">Fertility engine</Link> / Simulator
          </h1>
          <p className="text-14 text-ink-muted">Replay any signal sequence against two rule versions before publishing.</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <Button variant="outline" disabled title="Available once the mobile app syncs raw signals" leadingIcon={<UserFocus size={16} />}>Load real user (anonymised)</Button>
          <Button onClick={runSuiteNow} leadingIcon={<Play size={16} color="#fff" />}>Run test suite</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className={pill}><span className="text-ink-muted">Profile:</span><SelectField variant="pill" className="[&>select]:border-0 [&>select]:font-bold" aria-label="Profile" value={edited ? '' : caseKey} options={[...(edited ? [{ value: '', label: 'Edited signals' }] : []), ...cases.map((c) => ({ value: c.key, label: c.label }))]} onChange={loadCase} /></label>
        <label className={pill}><span className="text-ink-muted">Compare:</span>
          <SelectField variant="pill" className="[&>select]:border-0 [&>select]:font-bold" aria-label="Version A" value={aId} options={versionOptions} onChange={setAId} />
          <span className="text-ink-muted">vs</span>
          <SelectField variant="pill" className="[&>select]:border-0 [&>select]:font-bold" aria-label="Version B" value={bId} options={versionOptions} onChange={setBId} />
        </label>
        <label className={pill}><span className="text-ink-muted">Mode:</span><SelectField variant="pill" className="[&>select]:border-0 [&>select]:font-bold" aria-label="Mode" value={mode} options={SIM_MODES} onChange={(v) => { setMode(v as ModeKey); setEdited(true) }} /></label>
      </div>

      <SignalGrid signals={signals} note={edited ? undefined : current?.description} onChange={(next) => { setSignals(next); setEdited(true) }} />

      <div className="grid items-start gap-4 min-[1101px]:grid-cols-2">
        <RunResult version={a.version} result={ra} signals={signals} truthOv={truth} />
        <RunResult version={b.version} result={rb} signals={signals} truthOv={truth} />
      </div>

      <div className="grid items-start gap-4 min-[1101px]:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <GoldenSuite results={results} />
        <CanaryMonitor state={state} onRollback={() => setConfirm('rollback')} onExpand={() => setConfirm('expand')} />
      </div>

      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        tone={confirm === 'rollback' ? 'danger' : 'primary'}
        title={confirm === 'rollback' ? `Roll back ${canary?.version}?` : `Expand ${canary?.version} to 25%?`}
        description={confirm === 'rollback' ? 'Canary users go back to the live rules immediately. The version stays in the history.' : 'Five times more users get the new rules. Auto-rollback keeps watching the complaint rate.'}
        confirmLabel={confirm === 'rollback' ? 'Roll back' : 'Expand to 25%'}
        onConfirm={async () => {
          if (!canary) return
          await releaseVersion(canary.id, confirm === 'rollback' ? 'rollback' : 'expand_25')
          toast({ title: confirm === 'rollback' ? `${canary.version} rolled back` : `${canary.version} expanded to 25%` })
          onReload()
        }}
      />
    </>
  )
}
