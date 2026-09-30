import { X } from '@phosphor-icons/react'
import { useState, type KeyboardEvent } from 'react'
import { cn } from '../../lib/cn'

interface ChipInputProps {
  id?: string
  values: string[]
  onChange: (values: string[]) => void
  /** Return an error message to mark a chip invalid. */
  validate?: (value: string) => string | null
  placeholder?: string
}

/** Type a value and press Enter / comma / Tab to turn it into a chip. Paste splits on commas & spaces. */
export function ChipInput({ id, values, onChange, validate, placeholder }: ChipInputProps) {
  const [draft, setDraft] = useState('')

  const commit = (raw: string) => {
    const parts = raw.split(/[\s,;]+/).map((p) => p.trim()).filter(Boolean)
    if (parts.length === 0) return
    const next = [...values]
    for (const part of parts) if (!next.includes(part)) next.push(part)
    onChange(next)
    setDraft('')
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',' || (event.key === 'Tab' && draft.trim())) {
      event.preventDefault()
      commit(draft)
    } else if (event.key === 'Backspace' && !draft && values.length > 0) {
      onChange(values.slice(0, -1))
    }
  }

  return (
    <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-control border border-border bg-card px-2.5 py-1.5 focus-within:border-primary">
      {values.map((value) => {
        const error = validate?.(value)
        return (
          <span
            key={value}
            className={cn('inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-12 font-semibold', error ? 'bg-error-soft text-error' : 'bg-surface-alt')}
            title={error ?? undefined}
          >
            {value}
            <button type="button" className="inline-flex opacity-70" aria-label={`Remove ${value}`} onClick={() => onChange(values.filter((v) => v !== value))}>
              <X size={11} weight="bold" />
            </button>
          </span>
        )
      })}
      <input
        id={id}
        className="min-w-40 flex-1 border-0 bg-transparent text-12 font-semibold outline-0"
        value={draft}
        placeholder={values.length === 0 ? placeholder : undefined}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => commit(draft)}
        onPaste={(event) => {
          event.preventDefault()
          commit(event.clipboardData.getData('text'))
        }}
      />
    </div>
  )
}
