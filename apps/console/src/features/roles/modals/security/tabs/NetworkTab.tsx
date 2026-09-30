import { Plus, Trash } from '@phosphor-icons/react'
import { useState } from 'react'
import { Button, Field, ModalSection, ToggleRow, DateField } from '../../../../../shared/ui'
import { timeAgo } from '../../../../../shared/lib/format'
import { AUTOBLOCK, FAILED_LOGINS, LOCK_MINUTES } from '../../../config/security-options'
import type { AllowedRange } from '../../../types'
import type { SectionProps } from '../security-draft'
import { SelectGrid, SelectSetting } from './parts'

const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })

const INPUT = 'h-11 min-w-0 rounded-control border border-border bg-card px-3.5 text-13 font-semibold outline-0 placeholder:text-ink-faint focus-visible:border-primary'

interface NetworkTabProps extends SectionProps<'network'> {
  ranges: AllowedRange[]
  lastUsed: Map<string, string | null | undefined>
  onRanges: (ranges: AllowedRange[]) => void
}

export function NetworkTab({ value, onChange, ranges, lastUsed, onRanges }: NetworkTabProps) {
  const [adding, setAdding] = useState(false)
  const [cidr, setCidr] = useState('')
  const [label, setLabel] = useState('')
  const [expires, setExpires] = useState('')

  const add = () => {
    const next = cidr.trim()
    if (!next || !label.trim() || ranges.some((r) => r.cidr === next)) return
    onRanges([...ranges, { cidr: next, label: label.trim(), expires_on: expires || null }])
    setCidr('')
    setLabel('')
    setExpires('')
    setAdding(false)
  }

  return (
    <>
      <ModalSection label="IP allowlist">
        <div className="-mt-2 flex justify-end">
          <button type="button" className="inline-flex items-center gap-1 text-12 font-bold text-primary" onClick={() => setAdding((v) => !v)}>
            <Plus size={12} weight="bold" /> Add range
          </button>
        </div>
        <ToggleRow label="Restrict console to allowed networks" title="Restrict console to allowed networks" description="Requests from other IPs get “Access denied”" checked={value.ip_restricted} onChange={(ip_restricted) => onChange({ ip_restricted })} />
        {adding && (
          <div className="grid gap-2.5 rounded-xl bg-surface p-3 min-[701px]:grid-cols-[150px_minmax(0,1fr)_140px_auto] min-[701px]:items-end">
            <Field label="CIDR range"><input className={INPUT} aria-label="CIDR range" placeholder="203.0.113.0/24" value={cidr} onChange={(e) => setCidr(e.target.value)} /></Field>
            <Field label="Label"><input className={INPUT} aria-label="Label" placeholder="e.g. Surabaya office" value={label} onChange={(e) => setLabel(e.target.value)} /></Field>
            <Field label="Expires (optional)"><DateField aria-label="Expires" value={expires} onChange={setExpires} /></Field>
            <Button onClick={add} disabled={!cidr.trim() || !label.trim()} className="h-11">Add</Button>
          </div>
        )}
        <ul className="m-0 flex list-none flex-col rounded-xl border border-border p-0">
          {ranges.length === 0 && <li className="px-3.5 py-3 text-12 text-ink-muted">No ranges yet.</li>}
          {ranges.map((r) => {
            const seen = lastUsed.get(r.cidr)
            return (
              <li key={r.cidr} className="flex items-center gap-3 border-b border-border px-3.5 py-3 last:border-b-0">
                <span className="w-32 flex-none truncate font-mono text-12 font-semibold">{r.cidr}</span>
                <span className="min-w-0 flex-1 truncate text-13 font-semibold">
                  {r.label}
                  {r.expires_on && <span className="font-medium text-ink-muted"> · ends {day.format(new Date(r.expires_on))}</span>}
                </span>
                <span className="hidden flex-none text-11 text-ink-faint min-[701px]:inline">
                  {seen ? `last used ${timeAgo(seen)}` : lastUsed.has(r.cidr) ? 'never used' : 'new'}
                </span>
                <button type="button" aria-label={`Remove ${r.cidr}`} className="inline-flex size-7 flex-none items-center justify-center text-ink-muted hover:text-error" onClick={() => onRanges(ranges.filter((x) => x.cidr !== r.cidr))}>
                  <Trash size={15} />
                </button>
              </li>
            )
          })}
        </ul>
      </ModalSection>

      <ModalSection label="Geo restrictions">
        <ToggleRow label="Allow sign-in only from Indonesia" title="Allow sign-in only from Indonesia" description="Travelling? Request a 7-day exception" checked={value.indonesia_only} onChange={(indonesia_only) => onChange({ indonesia_only })} />
      </ModalSection>

      <ModalSection label="Rate limits & blocking">
        <SelectGrid>
          <SelectSetting label="Failed logins before lock" value={value.failed_logins} options={FAILED_LOGINS} onChange={(failed_logins) => onChange({ failed_logins })} />
          <SelectSetting label="Lock duration" value={value.lock_minutes} options={LOCK_MINUTES} onChange={(lock_minutes) => onChange({ lock_minutes })} />
          <SelectSetting label="Auto-block IP after" value={value.autoblock_per_hour} options={AUTOBLOCK} onChange={(autoblock_per_hour) => onChange({ autoblock_per_hour })} />
        </SelectGrid>
      </ModalSection>
    </>
  )
}
