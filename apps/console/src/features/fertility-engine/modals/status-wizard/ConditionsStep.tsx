import { useMemo } from 'react'
import { cn } from '../../../../shared/lib/cn'
import { ModalSection } from '../../../../shared/ui'
import { ruleSource, usedSignals } from '../../engine/rules'
import { statusImpact, withStatus } from '../../engine/overlap'
import type { EngineConfig, GoldenCase } from '../../types'
import { GroupsEditor } from './GroupsEditor'
import { groupsIssues, toStatus, type StatusForm } from './status-form'

interface StepProps {
  form: StatusForm
  update: (patch: Partial<StatusForm>) => void
  config: EngineConfig
  cases: GoldenCase[]
}

function Chip({ tone, children }: { tone: 'success' | 'warning' | 'info' | 'error'; children: React.ReactNode }) {
  const t = { success: 'bg-success-soft text-success', warning: 'bg-warning-soft text-warning-ink', info: 'bg-secondary-soft text-secondary', error: 'bg-error-soft text-error' }[tone]
  return <span className={cn('rounded-full px-2.5 py-1 text-11 font-bold', t)}>{children}</span>
}

export function ConditionsStep({ form, update, config, cases }: StepProps) {
  const status = useMemo(() => toStatus(form), [form])
  const issues = groupsIssues(form.entry) + groupsIssues(form.exit)
  const next = useMemo(() => {
    const merged = withStatus(config, status)
    const list = merged.statuses.filter((s) => s.modes.some((m) => status.modes.includes(m)))
    const at = merged.statuses.find((s) => s.key === status.key)?.order ?? 0
    return { merged, above: merged.statuses.find((s) => s.order === at - 1), below: merged.statuses.find((s) => s.order === at + 1), list }
  }, [config, status])
  const impact = useMemo(() => (issues === 0 && form.entry.length > 0 ? statusImpact(next.merged, status.key, cases) : null), [issues, form.entry.length, next.merged, status.key, cases])
  const signals = usedSignals(status)

  return (
    <>
      <ModalSection label="Entry conditions">
        <GroupsEditor groups={form.entry} onChange={(entry) => update({ entry })} label="entry" />
      </ModalSection>
      <ModalSection label="Exit conditions">
        <GroupsEditor groups={form.exit} onChange={(exit) => update({ exit })} label="exit" />
        {form.exit.length > 0 && next.below && <p className="m-0 text-11 text-ink-muted">→ hands over to “{next.below.name}” or the next matching status</p>}
      </ModalSection>
      <ModalSection label="Rule preview">
        <pre className="m-0 overflow-x-auto rounded-xl bg-ink p-4 font-mono text-12 leading-relaxed whitespace-pre-wrap text-white/90">{ruleSource(status)}</pre>
        <div className="flex flex-wrap gap-2">
          {issues === 0 ? <Chip tone="success">Syntax valid</Chip> : <Chip tone="error">{`${issues} condition${issues === 1 ? '' : 's'} to fix`}</Chip>}
          {impact && next.above && <Chip tone={impact.overlap(next.above.key) === 0 ? 'success' : 'warning'}>{`${impact.overlap(next.above.key) === 0 ? 'No overlap' : 'Overlaps'} with ${next.above.name} (order ${next.above.order})`}</Chip>}
          {impact && next.below && <Chip tone="success">{`Overlaps “${next.below.name}” for ${impact.overlap(next.below.key)} case${impact.overlap(next.below.key) === 1 ? '' : 's'}`}</Chip>}
          <Chip tone="info">{`Uses ${signals.length} signal${signals.length === 1 ? '' : 's'} · all available in the current schema`}</Chip>
        </div>
      </ModalSection>
    </>
  )
}
