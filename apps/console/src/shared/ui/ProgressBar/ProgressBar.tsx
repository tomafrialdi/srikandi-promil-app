interface ProgressBarProps {
  /** 0–100 */
  value: number
  color?: string
  height?: number
  radius?: number
}

export function ProgressBar({ value, color = 'var(--primary)', height = 8, radius = 100 }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value))
  return (
    <div
      className="w-full min-w-0 overflow-hidden bg-surface-alt"
      style={{ height, borderRadius: radius }}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div className="h-full" style={{ width: `${clamped}%`, background: color, borderRadius: radius }} />
    </div>
  )
}
