import { useState } from 'react'
import { Badge, Button, Card, type BadgeTone } from '../../../../shared/ui'
import type { CaseChange, CaseResult } from '../../engine/golden'
import { suiteSummary } from '../../engine/golden'

const CHANGE: Record<CaseChange, { tone: BadgeTone; label: string }> = {
  improved: { tone: 'success', label: 'improved' },
  changed: { tone: 'warning', label: 'changed' },
  unchanged: { tone: 'neutral', label: 'unchanged' },
  regressed: { tone: 'error', label: 'regressed' },
}
const RANK: Record<CaseChange, number> = { regressed: 0, improved: 1, changed: 2, unchanged: 3 }

function note(r: CaseResult): string {
  if (r.a.predictedOv !== r.b.predictedOv) return `Ovulation predicted CD ${r.a.predictedOv ?? '—'} → ${r.b.predictedOv != null ? `CD ${r.b.predictedOv}` : 'none'}`
  if (r.a.confidence !== r.b.confidence) return `Confidence ${r.a.confidence}% → ${r.b.confidence}%`
  return r.case.label
}

export function GoldenSuite({ results }: { results: CaseResult[] }) {
  const [all, setAll] = useState(false)
  const s = suiteSummary(results)
  const sorted = [...results].sort((a, b) => RANK[a.change] - RANK[b.change])
  const shown = all ? sorted : sorted.slice(0, 4)
  return (
    <Card className="gap-3.5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-16 font-bold">Golden test suite</h2>
          <p className="text-12 font-medium text-ink-muted">{results.length} labelled cycles, replayed against both versions</p>
        </div>
        <Badge tone={s.failed > 0 ? 'error' : 'success'}>{`${s.pass} / ${s.total} pass`}</Badge>
      </header>
      <div className="h-2 overflow-hidden rounded-full bg-error-soft" role="img" aria-label={`${s.pass} of ${s.total} pass`}>
        <div className="h-full bg-success" style={{ width: `${s.total ? (s.pass / s.total) * 100 : 0}%` }} />
      </div>
      <ul className="m-0 flex list-none flex-col p-0">
        {shown.map((r) => (
          <li key={r.case.key} className="grid grid-cols-[minmax(0,210px)_minmax(0,1fr)_auto] items-center gap-3 border-t border-border py-2.5">
            <span className="truncate font-mono text-12 font-semibold">{r.case.key}</span>
            <span className="truncate text-12 text-ink-muted">{note(r)}</span>
            <Badge tone={CHANGE[r.change].tone}>{CHANGE[r.change].label}</Badge>
          </li>
        ))}
      </ul>
      {results.length > 4 && <Button variant="outline" className="self-start" onClick={() => setAll((v) => !v)}>{all ? 'Show fewer' : `Show all ${results.length}`}</Button>}
    </Card>
  )
}
