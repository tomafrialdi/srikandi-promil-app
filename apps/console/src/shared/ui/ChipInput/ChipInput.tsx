import { X } from '@phosphor-icons/react'
import { useState, type KeyboardEvent } from 'react'
import styles from './ChipInput.module.css'

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
    <div className={styles.box}>
      {values.map((value) => {
        const error = validate?.(value)
        return (
          <span key={value} className={`${styles.chip} ${error ? styles.invalid : ''}`} title={error ?? undefined}>
            {value}
            <button
              type="button"
              className={styles.remove}
              aria-label={`Remove ${value}`}
              onClick={() => onChange(values.filter((v) => v !== value))}
            >
              <X size={11} weight="bold" />
            </button>
          </span>
        )
      })}
      <input
        id={id}
        className={styles.input}
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
