import styles from './Sparkline.module.css'

interface SparklineProps {
  values: number[]
  color?: string
  height?: number
}

/** Tiny bar sparkline; the last bar is emphasised. */
export function Sparkline({ values, color = 'var(--primary)', height = 26 }: SparklineProps) {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  return (
    <span className={styles.spark} style={{ height }} aria-hidden="true">
      {values.map((value, index) => {
        const isLast = index === values.length - 1
        const barHeight = 6 + ((value - min) / range) * (height - 6)
        return (
          <span
            key={index}
            className={styles.bar}
            style={{ height: barHeight, background: color, opacity: isLast ? 1 : 0.33 }}
          />
        )
      })}
    </span>
  )
}
