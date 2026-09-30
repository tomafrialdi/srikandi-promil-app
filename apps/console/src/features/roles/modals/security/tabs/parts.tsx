import { Lock } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { cn } from '../../../../../shared/lib/cn'
import { Field, SelectField, type SelectOption } from '../../../../../shared/ui'

interface SelectSettingProps {
  label: string
  value: number
  options: SelectOption[]
  onChange: (value: number) => void
  disabled?: boolean
}

export function SelectSetting({ label, value, options, onChange, disabled }: SelectSettingProps) {
  return (
    <Field label={label}>
      <SelectField aria-label={label} value={String(value)} options={options} disabled={disabled} onChange={(v) => onChange(Number(v))} />
    </Field>
  )
}

/** Title with a small lock: the setting is enforced and can't be turned off. */
export function Locked({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {children}
      <Lock size={12} className="text-ink-faint" aria-label="Locked" />
    </span>
  )
}

export function SelectGrid({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 min-[701px]:grid-cols-3">{children}</div>
}

const TONE = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning-ink',
  error: 'bg-error-soft text-error',
  info: 'bg-secondary-soft text-secondary',
}

export function Tile({ tone, label, value }: { tone: keyof typeof TONE; label: string; value: string }) {
  return (
    <div className={cn('flex flex-col gap-0.5 rounded-xl px-3.5 py-3', TONE[tone])}>
      <span className="text-11 font-bold">{label}</span>
      <span className="text-16 font-extrabold text-ink">{value}</span>
    </div>
  )
}

export function InfoBox({ tone = 'info', children }: { tone?: 'info' | 'surface'; children: ReactNode }) {
  return <div className={cn('flex flex-col gap-1 rounded-xl px-3.5 py-3', tone === 'info' ? 'bg-secondary-soft text-secondary' : 'bg-surface')}>{children}</div>
}
