import { BracketsCurly, Eye, Flask, Funnel, GitBranch, Pulse, Sigma, Tray, Wrench, PaperPlaneTilt, type Icon } from '@phosphor-icons/react'
import { Badge, Button, DataTable, Modal, ModalFooter, ModalSection, type BadgeTone, type Column } from '../../../shared/ui'
import { cn } from '../../../shared/lib/cn'
import { MODE_LABEL } from '../../../shared/lib/labels'
import type { EngineLog } from '../types'

type Day = EngineLog['day_by_day'][number]

const outputTone = (output: string): BadgeTone => (/menstrual/i.test(output) ? 'error' : /→/.test(output) ? 'warning' : /high|peak/i.test(output) ? 'primary' : 'neutral')

function lhLook(lh: string | null, overridden: boolean) {
  if (!lh) return { text: '—', className: 'text-ink-muted' }
  if (/peak/i.test(lh)) return { text: overridden ? `${lh} ✎` : lh, className: 'text-primary' }
  if (/high/i.test(lh)) return { text: lh, className: 'text-[#e07a9b]' }
  return { text: lh, className: 'text-ink-muted' }
}

/** Icon + tint for each step of the decision trace ("1 · Inputs", "2 · Validate", …). */
function stepLook(step: string): { icon: Icon; tile: string } {
  if (/input/i.test(step)) return { icon: Tray, tile: 'bg-secondary-soft text-secondary' }
  if (/valid/i.test(step)) return { icon: Funnel, tile: 'bg-surface-alt text-ink-muted' }
  if (/score/i.test(step)) return { icon: Sigma, tile: 'bg-warning-soft text-warning-ink' }
  if (/resolve/i.test(step)) return { icon: GitBranch, tile: 'bg-primary-soft text-primary' }
  return { icon: PaperPlaneTilt, tile: 'bg-success-soft text-success' }
}

function downloadJson(name: string, data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

/** Unmasked engine decision log. Only opened after a reason was entered (logged server-side). */
export function EngineLogModal({ data, onClose }: { data: EngineLog | null; onClose: () => void }) {
  const columns: Column<Day>[] = [
    { key: 'cd', header: 'CD', width: 50, render: (d) => <span className="text-12 font-extrabold">{d.cd}</span> },
    { key: 'date', header: 'DATE', width: 90, render: (d) => <span className="text-12 font-medium text-ink-muted">{d.date}</span> },
    { key: 'bbt', header: 'BBT °C', width: 100, render: (d) => <span className="text-12 font-medium">{d.bbt ?? '—'}</span> },
    {
      key: 'lh',
      header: 'LH',
      width: 100,
      render: (d, ) => {
        const look = lhLook(d.lh, (data?.overrides.length ?? 0) > 0 && d === data?.day_by_day[data.day_by_day.length - 1])
        return <span className={cn('text-12 font-bold', look.className)}>{look.text}</span>
      },
    },
    { key: 'fluid', header: 'CERVICAL FLUID', width: 130, render: (d) => <span className="text-12 font-medium">{d.fluid ?? '—'}</span> },
    { key: 'score', header: 'SCORE', width: 70, render: (d) => <span className="text-12 font-medium">{d.score}</span> },
    { key: 'output', header: 'STATUS OUTPUT', render: (d) => <Badge tone={outputTone(d.output)}>{d.output}</Badge> },
  ]

  return (
    <Modal
      open={data !== null}
      onClose={onClose}
      size="xl"
      icon={<Pulse size={20} />}
      title={`Fertility engine log · ${data?.name ?? ''}`}
      subtitle={data ? `Cycle ${data.cycle_no} · ${MODE_LABEL[data.mode]} mode · rule set ${data.rule_set} · health data unmasked (logged)` : undefined}
      footer={
        <ModalFooter info={data ? <span className="inline-flex items-center gap-1.5"><Eye size={14} className="text-ink-faint" />This view was logged: {data.logged_by ?? 'you'} · reason {data.reason}</span> : undefined}>
          <Button variant="outline" onClick={() => data && downloadJson(`engine-log-cycle-${data.cycle_no}.json`, data)} leadingIcon={<BracketsCurly size={16} />}>
            Export JSON
          </Button>
          <Button disabled title="Simulator replay is not available yet" leadingIcon={<Flask size={16} color="#fff" />}>
            Replay in simulator
          </Button>
        </ModalFooter>
      }
    >
      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 min-[701px]:grid-cols-4">
            <Tile tone="bg-primary-soft text-primary" label="Status now" value={data.status} />
            <Tile tone="bg-success-soft text-success" label="Confidence" value={`${data.confidence}%`} />
            <Tile tone="bg-secondary-soft text-secondary" label="Predicted ovulation" value={data.predicted_ovulation} />
            <Tile tone="bg-warning-soft text-warning-ink" label="Overrides" value={data.overrides_count > 0 ? `${data.overrides_count} (support)` : 'None'} />
          </div>

          <ModalSection label="Day-by-day">
            <DataTable columns={columns} rows={data.day_by_day} rowKey={(d) => String(d.cd)} rowHeight={40} bleed={false} isRowSelected={(d) => d === data.day_by_day[data.day_by_day.length - 1]} />
          </ModalSection>

          <ModalSection label="Decision trace · today 06:21">
            <ol className="m-0 flex list-none flex-col p-0">
              {data.decision_trace.map((step, index) => {
                const { icon: Glyph, tile } = stepLook(step.step)
                const last = index === data.decision_trace.length - 1
                const formula = /score/i.test(step.step)
                return (
                  <li key={step.step} className="flex items-stretch gap-3">
                    <span className="flex w-8 flex-none flex-col items-center">
                      <span className={cn('inline-flex size-8 flex-none items-center justify-center rounded-full', tile)}><Glyph size={15} /></span>
                      {!last && <span className="my-1 min-h-3 w-0.5 flex-1 rounded-full bg-border" />}
                    </span>
                    <span className={cn('flex min-w-0 flex-1 flex-col gap-[3px] pt-[5px]', !last && 'pb-3.5')}>
                      <span className="text-13 font-extrabold">{step.step}</span>
                      <span className={cn(formula ? 'rounded-md bg-surface-alt px-2 py-1.5 font-mono text-11 leading-normal font-medium' : 'text-12 leading-normal font-medium text-ink-muted')}>{step.body}</span>
                    </span>
                  </li>
                )
              })}
            </ol>
          </ModalSection>

          {data.overrides.map((override) => (
            <div key={override.at} className="flex shrink-0 items-start gap-3 rounded-xl bg-warning-soft px-4 py-3.5 text-warning-ink">
              <Wrench size={16} className="mt-0.5 flex-none" />
              <div className="flex min-w-0 flex-col gap-0.5">
                <strong className="text-13 font-bold">Support override · {override.at}</strong>
                <span className="text-12 leading-normal font-medium">
                  {override.by} changed LH result “{override.from}” → “{override.to}” (ticket {override.ticket}).
                </span>
              </div>
            </div>
          ))}
        </>
      )}
    </Modal>
  )
}

function Tile({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className={cn('flex flex-col gap-0.5 rounded-xl p-3', tone)}>
      <span className="text-11 font-bold">{label}</span>
      <span className="text-15 font-extrabold text-ink">{value}</span>
    </div>
  )
}
