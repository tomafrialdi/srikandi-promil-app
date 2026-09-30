import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import styles from './CodeInput.module.css'

interface CodeInputProps {
  length?: number
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  disabled?: boolean
  hasError?: boolean
}

/** N single-digit boxes that behave like one numeric field (typing, backspace, paste). */
export function CodeInput({ length = 6, value, onChange, onComplete, disabled, hasError }: CodeInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    refs.current[0]?.focus()
  }, [])

  const update = (next: string) => {
    onChange(next)
    if (next.length === length) onComplete?.(next)
  }

  const handleInput = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1)
    if (!digit) return
    update((value.slice(0, index) + digit + value.slice(index + 1)).slice(0, length))
    refs.current[Math.min(index + 1, length - 1)]?.focus()
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault()
      if (value[index]) update(value.slice(0, index) + value.slice(index + 1))
      else if (index > 0) {
        update(value.slice(0, index - 1) + value.slice(index))
        refs.current[index - 1]?.focus()
      }
    } else if (event.key === 'ArrowLeft') refs.current[Math.max(0, index - 1)]?.focus()
    else if (event.key === 'ArrowRight') refs.current[Math.min(length - 1, index + 1)]?.focus()
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    update(pasted)
    refs.current[Math.min(pasted.length, length - 1)]?.focus()
  }

  return (
    <div className={styles.code} role="group" aria-label="Verification code">
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node
          }}
          className={`${styles.digit} ${hasError ? styles.error : ''}`}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={value[index] ?? ''}
          disabled={disabled}
          aria-label={`Digit ${index + 1}`}
          onChange={(event) => handleInput(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
        />
      ))}
    </div>
  )
}
