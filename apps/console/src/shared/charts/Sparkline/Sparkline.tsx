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
    <span className="inline-flex flex-none items-end gap-0.5" style={{ height }} aria-hidden="true">
      {values.map((value, index) => (
        <span
          key={index}
          className="w-1 rounded-[1px]"
          style={{ height: 6 + ((value - min) / range) * (height - 6), background: color, opacity: index === values.length - 1 ? 1 : 0.33 }}
        />
      ))}
    </span>
  )
}
