import { CaretRight } from '@phosphor-icons/react'
import { Badge, Card } from '../../../shared/ui'
import { StatusIcon } from './StatusIcon'
import type { EngineConfig } from '../types'

const TILE: Record<string, string> = {
  inputs: 'bg-secondary-soft text-secondary',
  validate: 'bg-surface-alt text-ink-muted',
  score: 'bg-warning-soft text-warning-ink',
  resolve: 'bg-primary-soft text-primary',
  outputs: 'bg-success-soft text-success',
}

export function PipelineCard({ pipeline }: { pipeline?: EngineConfig['pipeline'] }) {
  return (
    <Card className="gap-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-16 font-bold">Pipeline</h2>
          <p className="text-12 font-medium text-ink-muted">{pipeline?.runs ?? '…'}</p>
        </div>
        {pipeline && <Badge tone="success">{`p95 latency ${pipeline.p95_ms} ms`}</Badge>}
      </header>
      <div className="grid gap-3 min-[1101px]:grid-cols-[repeat(5,minmax(0,1fr))] min-[1101px]:gap-0">
        {(pipeline?.steps ?? []).map((step, index) => {
          return (
            <div key={step.key} className="flex items-stretch min-[1101px]:items-center">
              <div className="flex min-w-0 flex-1 flex-col gap-2.5 rounded-xl border border-border bg-surface p-3.5">
                <div className="flex items-center gap-2.5">
                  <span className={`inline-flex size-7 flex-none items-center justify-center rounded-lg ${TILE[step.key] ?? TILE.validate}`}>
                    <StatusIcon name={step.icon} size={15} />
                  </span>
                  <span className="text-13 font-bold">{index + 1} · {step.title}</span>
                </div>
                <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                  {step.items.map((item) => (
                    <li key={item} className="flex gap-2 text-11 leading-snug font-medium text-ink-muted">
                      <span className="mt-1.5 size-1 flex-none rounded-full bg-ink-faint" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              {index < pipeline!.steps.length - 1 && <CaretRight size={14} className="mx-1 hidden flex-none text-ink-faint min-[1101px]:block" />}
            </div>
          )
        })}
      </div>
    </Card>
  )
}
