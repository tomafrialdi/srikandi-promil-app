import { DownloadSimple, Warning } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Button, ChipToggleGroup, Field, Modal, ModalFooter, ModalSection, Notice, RadioCard, TextField, ToggleRow, useToast, DateField } from '../../../shared/ui'
import { downloadCsv } from '../../../shared/lib/csv'
import { formatNumber } from '../../../shared/lib/format'
import { CATEGORIES, RANGES } from '../config/labels'
import { localDateInput, maskRef } from '../lib/format'
import { countAudit, exportAudit } from '../services/audit.service'
import type { AuditEventDetail, ExportScope, Range } from '../types'

interface ExportModalProps {
  open: boolean
  onClose: () => void
  category: string
  range: Range
  onDone: () => void
}

type Format = 'csv' | 'json'

/** ≈ rows × 180 bytes of CSV, for the size hint. */
const sizeHint = (n: number) => (n * 180 > 1_000_000 ? `~${Math.round((n * 180) / 1_000_000)} MB` : `~${Math.max(1, Math.round((n * 180) / 1000))} KB`)

/** Mount with a key per opening so the form starts from the page's current filters. */
export function ExportModal({ open, onClose, category, range, onDone }: ExportModalProps) {
  const toast = useToast()
  const [today] = useState(() => localDateInput(new Date()))
  const [scope, setScope] = useState<ExportScope>(() => ({ from: localDateInput(new Date(Date.now() - (RANGES.find((r) => r.value === range)?.hours ?? 24) * 3_600_000)), to: today, category }))
  const [format, setFormat] = useState<Format>('csv')
  const [purpose, setPurpose] = useState('')
  const [mask, setMask] = useState(true)
  const [hashes, setHashes] = useState(true)
  const [count, setCount] = useState<number | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!scope.from || !scope.to || scope.from > scope.to) return setCount(null)
    let cancelled = false
    const id = window.setTimeout(() => {
      countAudit(scope).then((n) => !cancelled && setCount(Number(n))).catch(() => !cancelled && setCount(null))
    }, 300)
    return () => {
      cancelled = true
      window.clearTimeout(id)
    }
  }, [scope])

  const issue = !scope.from || !scope.to || scope.from > scope.to ? 'Pick a valid period' : purpose.trim().length < 3 ? 'Describe the purpose (required)' : count === 0 ? 'Nothing to export in this period' : null

  const run = async () => {
    setBusy(true)
    setError(null)
    try {
      const { rows, count: n } = await exportAudit(scope, purpose.trim())
      const stamp = `${scope.from}_${scope.to}`
      const m = (v: string | null) => (mask ? maskRef(v) : v)
      if (format === 'csv') {
        const headers = ['event', 'time', 'actor', 'role', 'category', 'risk', 'action', 'summary', 'resource', 'ip', 'device', ...(hashes ? ['hash', 'prev_hash'] : [])]
        downloadCsv(`audit-log_${stamp}.csv`, headers, rows.map((r: AuditEventDetail) => [r.evt, r.at, r.actor.name, r.actor.role, r.category, r.risk, r.action, m(r.summary), m(r.resource), r.ip, r.device, ...(hashes ? [r.hash, r.prev_hash] : [])]))
      } else {
        const out = rows.map((r) => ({ event: r.evt, time: r.at, actor: r.actor, category: r.category, risk: r.risk, action: r.action, summary: m(r.summary), resource: m(r.resource), ip: r.ip, device: r.device, ...(hashes ? { hash: r.hash, prev_hash: r.prev_hash } : {}), ...(mask ? {} : { metadata: r.metadata }) }))
        const url = URL.createObjectURL(new Blob([JSON.stringify(out, null, 2)], { type: 'application/json' }))
        const link = document.createElement('a')
        link.href = url
        link.download = `audit-log_${stamp}.json`
        link.click()
        URL.revokeObjectURL(url)
      }
      toast({ title: 'Export downloaded', description: `${formatNumber(n)} events · logged in the audit trail` })
      onDone()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The export failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !busy && onClose()}
      size="md"
      icon={<DownloadSimple size={20} />}
      title="Export audit log"
      subtitle="Exports are themselves logged, with their purpose"
      footer={
        <ModalFooter info={issue ?? 'This export will appear in the log'}>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={run} disabled={busy || issue !== null}>{busy ? 'Exporting…' : 'Request export'}</Button>
        </ModalFooter>
      }
    >
      {error && <Notice tone="error" icon={<Warning size={16} />}>{error}</Notice>}
      <ModalSection label="Scope">
        <div className="grid gap-3 min-[701px]:grid-cols-2">
          <Field label="From" htmlFor="ex-from"><DateField id="ex-from" clearable={false} max={scope.to} value={scope.from} onChange={(from) => setScope((s) => ({ ...s, from }))} /></Field>
          <Field label="To" htmlFor="ex-to"><DateField id="ex-to" clearable={false} min={scope.from} max={today} value={scope.to} onChange={(to) => setScope((s) => ({ ...s, to }))} /></Field>
        </div>
        <Field label="Category">
          <ChipToggleGroup label="Category" single options={[{ value: '', label: 'All' }, ...CATEGORIES.map((c) => ({ value: c.key, label: c.label }))]} selected={[scope.category]} onChange={([category]) => setScope((s) => ({ ...s, category: category ?? '' }))} />
        </Field>
      </ModalSection>
      <ModalSection label="Format">
        <div className="grid gap-2.5 min-[701px]:grid-cols-3">
          <RadioCard name="export-format" selected={format === 'csv'} onSelect={() => setFormat('csv')} title="CSV" description="Spreadsheet-friendly" />
          <RadioCard name="export-format" selected={format === 'json'} onSelect={() => setFormat('json')} title="JSON" description="Full detail" />
          <RadioCard name="export-format" selected={false} onSelect={() => undefined} title="PDF report" description="Not available yet" disabled />
        </div>
      </ModalSection>
      <ModalSection label="Purpose & safeguards">
        <Field label="Purpose (required)" htmlFor="ex-purpose"><TextField id="ex-purpose" label="" hideLabel maxLength={200} placeholder="e.g. ISO 27001 surveillance audit" value={purpose} onChange={(e) => setPurpose(e.target.value)} /></Field>
        <ToggleRow label="Mask user IDs" title="Mask user IDs (pseudonymise)" description="Hides user references and drops the raw event metadata" checked={mask} onChange={setMask} />
        <ToggleRow label="Include hash chain" title="Include hash-chain signature" description="Adds each event's hash so the auditor can verify it" checked={hashes} onChange={setHashes} />
      </ModalSection>
      <p className="rounded-xl bg-surface px-4 py-3 text-12 font-semibold text-ink-muted">
        {count == null ? 'Counting events…' : `≈ ${formatNumber(count)} events · ${sizeHint(count)}${count > 50_000 ? ' · over the 50,000 limit, narrow the scope' : ''}`}
      </p>
    </Modal>
  )
}
