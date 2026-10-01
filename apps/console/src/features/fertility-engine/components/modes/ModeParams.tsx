import { useState } from 'react'
import { Card, CardHeader } from '../../../../shared/ui'
import { COLORS } from '../../engine/fields'
import type { ColorKey, ModeConfig } from '../../types'

interface ModeParamsProps {
  params: ModeConfig['params']
  baseline: ModeConfig['params']
  color: ColorKey
  isBaseline: boolean
  canEdit: boolean
  value: (key: string) => string
  onChange: (key: string, value: string) => void
}

function ParamChip({ value, changed, tone, canEdit, label, onChange }: { value: string; changed: boolean; tone: (typeof COLORS)[ColorKey]; canEdit: boolean; label: string; onChange: (v: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(value)
  const commit = () => {
    setEditing(false)
    if (text.trim() && text.trim() !== value) onChange(text.trim())
    else setText(value)
  }
  if (editing) {
    return (
      <input autoFocus aria-label={label} className="h-[26px] w-52 max-w-[55%] rounded-lg border bg-card px-2.5 text-right text-12 font-semibold outline-0" style={{ borderColor: tone.strong }} maxLength={80} value={text} onChange={(e) => setText(e.target.value)} onBlur={commit} onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setText(value); setEditing(false) } }} />
    )
  }
  return (
    <button type="button" disabled={!canEdit} title={canEdit ? 'Click to edit' : undefined} className="max-w-[55%] truncate rounded-lg border px-2.5 py-1 text-12 font-semibold enabled:cursor-text" style={changed ? { background: tone.soft, borderColor: tone.hex } : { background: 'var(--surface)', borderColor: 'var(--border)' }} onClick={() => { setText(value); setEditing(true) }}>
      {value}
    </button>
  )
}

export function ModeParams({ params, baseline, color, isBaseline, canEdit, value, onChange }: ModeParamsProps) {
  const tone = COLORS[color]
  return (
    <Card className="gap-1">
      <CardHeader title="Cycle & ovulation parameters" />
      <ul className="m-0 mt-2 flex list-none flex-col p-0">
        {params.map((p) => {
          const base = baseline.find((b) => b.key === p.key)
          const current = value(p.key)
          const changed = !isBaseline && (!base || base.value !== current)
          const sub = p.note ?? (p.base ? `TTC: ${p.base}` : p.hint)
          return (
            <li key={p.key} className="flex min-h-[46px] items-center justify-between gap-3 border-t border-border py-2.5 first:border-t-0">
              <span className="flex min-w-0 flex-col">
                <span className="text-12 font-semibold">{p.label}</span>
                {sub && <span className="text-11 font-medium" style={{ color: !isBaseline && (p.note || p.base) ? tone.strong : 'var(--ink-faint)' }}>{sub}</span>}
              </span>
              <ParamChip value={current} changed={changed} tone={tone} canEdit={canEdit} label={p.label} onChange={(v) => onChange(p.key, v)} />
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
