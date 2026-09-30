import { UploadSimple, Warning } from '@phosphor-icons/react'
import { useState } from 'react'
import { Button, Modal, ModalFooter, ModalSection, Notice, useToast } from '../../../shared/ui'
import { parseCsv } from '../lib/clinic-form'
import { importClinics } from '../services/clinics.service'
import type { ImportRow } from '../types'

const TYPE_WORDS: Record<string, string> = {
  fertility: 'fertility', 'fertility clinic': 'fertility', hospital: 'hospital', rs: 'hospital', rsia: 'hospital', obgyn: 'obgyn', 'ob-gyn': 'obgyn', 'ob-gyn practice': 'obgyn',
  laboratory: 'laboratory', lab: 'laboratory', 'private practice': 'private_practice', private_practice: 'private_practice',
}
const ALIASES: Record<keyof ImportRow, string[]> = {
  name: ['name', 'clinic', 'clinic name', 'nama'], type: ['type', 'clinic type', 'tipe'], city: ['city', 'kota'], province: ['province', 'provinsi'],
  address: ['address', 'alamat', 'street'], phone: ['phone', 'telepon', 'tel'], email: ['email'], website: ['website', 'url', 'web'],
}

function mapRows(text: string): { rows: ImportRow[]; error?: string } {
  const table = parseCsv(text)
  if (table.length < 2) return { rows: [], error: 'The file needs a header row and at least one clinic.' }
  const head = table[0]!.map((h) => h.trim().toLowerCase())
  const col = (k: keyof ImportRow) => head.findIndex((h) => ALIASES[k].includes(h))
  if (col('name') < 0 || col('city') < 0) return { rows: [], error: 'The header needs at least “name” and “city” columns.' }
  const get = (r: string[], k: keyof ImportRow) => (col(k) >= 0 ? (r[col(k)] ?? '').trim() : '')
  const rows = table.slice(1).map<ImportRow>((r) => {
    const rawType = get(r, 'type').toLowerCase()
    return { name: get(r, 'name'), type: rawType ? TYPE_WORDS[rawType] ?? rawType : '', city: get(r, 'city'), province: get(r, 'province'), address: get(r, 'address'), phone: get(r, 'phone'), email: get(r, 'email'), website: get(r, 'website') }
  })
  return { rows }
}

export function ImportCsvModal({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const toast = useToast()
  const [rows, setRows] = useState<ImportRow[]>([])
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<{ created: number; skipped: Array<{ row: number; reason: string }> } | null>(null)

  const pick = async (file: File | undefined) => {
    if (!file) return
    setResult(null)
    setFileName(file.name)
    const parsed = mapRows(await file.text())
    setRows(parsed.rows)
    setError(parsed.error ?? null)
  }

  const run = async () => {
    setBusy(true)
    setError(null)
    try {
      const r = await importClinics(rows)
      setResult(r)
      toast({ title: `${r.created} clinic${r.created === 1 ? '' : 's'} imported`, description: r.skipped.length ? `${r.skipped.length} skipped` : 'All rows imported as drafts.' })
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} onClose={() => !busy && onClose()} size="md" icon={<UploadSimple size={20} />} title="Import clinics from CSV" subtitle="Every row becomes a draft that you complete and verify later."
      footer={<ModalFooter info={rows.length ? `${rows.length} row${rows.length === 1 ? '' : 's'} in ${fileName}` : 'Columns: name, city (required) · type, province, address, phone, email, website'}><Button variant="outline" onClick={onClose} disabled={busy}>{result ? 'Done' : 'Cancel'}</Button>{!result && <Button onClick={run} disabled={busy || rows.length === 0}>{busy ? 'Importing…' : `Import ${rows.length || ''} clinics`}</Button>}</ModalFooter>}>
      {error && <Notice tone="error" icon={<Warning size={16} />}>{error}</Notice>}
      <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-surface px-4 py-8 text-center">
        <UploadSimple size={24} className="text-ink-muted" />
        <span className="text-13 font-bold">{fileName || 'Choose a CSV file'}</span>
        <span className="text-12 text-ink-muted">Comma or semicolon separated · max 500 rows</span>
        <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => void pick(e.target.files?.[0])} />
      </label>
      {rows.length > 0 && !result && (
        <ModalSection label="Preview">
          <ul className="m-0 flex list-none flex-col rounded-xl border border-border p-0">
            {rows.slice(0, 6).map((r, i) => (
              <li key={i} className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] gap-3 border-b border-border px-3.5 py-2.5 text-12 last:border-b-0"><b className="truncate">{r.name || '—'}</b><span className="truncate text-ink-muted">{r.city || '—'}</span><span className="truncate text-ink-muted">{r.type || 'fertility'}</span></li>
            ))}
          </ul>
          {rows.length > 6 && <p className="m-0 text-11 text-ink-muted">…and {rows.length - 6} more.</p>}
        </ModalSection>
      )}
      {result && (
        <ModalSection label="Result">
          <p className="m-0 text-13 font-bold text-success">{result.created} imported as drafts</p>
          {result.skipped.length > 0 && <ul className="m-0 list-none p-0 text-12 text-ink-muted">{result.skipped.slice(0, 8).map((s) => <li key={s.row}>Row {s.row}: {s.reason}</li>)}</ul>}
        </ModalSection>
      )}
    </Modal>
  )
}
