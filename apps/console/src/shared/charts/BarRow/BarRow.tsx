import type { CSSProperties, ReactNode } from 'react'
import { ProgressBar } from '../../ui'
import styles from './BarRow.module.css'

interface BarRowProps {
  label: ReactNode
  /** 0–100 */
  value: number
  color?: string
  /** Text right of the bar. */
  valueLabel?: ReactNode
  /** Extra trailing cell (e.g. CAC). */
  extra?: ReactNode
  labelWidth?: number
  valueWidth?: number
  extraWidth?: number
  barHeight?: number
  radius?: number
}

/** `label ▬▬▬▬▬ value  extra` – the workhorse of the analytics cards. */
export function BarRow({
  label,
  value,
  color,
  valueLabel,
  extra,
  labelWidth = 130,
  valueWidth = 44,
  extraWidth = 74,
  barHeight = 10,
  radius = 3,
}: BarRowProps) {
  const cell = (width: number, align?: CSSProperties['textAlign']): CSSProperties => ({ width, textAlign: align })
  return (
    <div className={styles.row}>
      <span className={styles.label} style={cell(labelWidth)}>
        {label}
      </span>
      <span className={styles.bar}>
        <ProgressBar value={value} color={color} height={barHeight} radius={radius} />
      </span>
      {valueLabel != null && (
        <span className={styles.value} style={cell(valueWidth, 'right')}>
          {valueLabel}
        </span>
      )}
      {extra != null && (
        <span className={styles.extra} style={cell(extraWidth, 'right')}>
          {extra}
        </span>
      )}
    </div>
  )
}
