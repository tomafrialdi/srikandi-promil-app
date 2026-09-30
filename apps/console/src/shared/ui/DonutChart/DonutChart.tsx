import type { ReactNode } from 'react'

export interface DonutSegment {
  value: number
  color: string
}

interface DonutChartProps {
  segments: DonutSegment[]
  size?: number
  thickness?: number
  children?: ReactNode
}

export function DonutChart({ segments, size = 140, thickness = 22, children }: DonutChartProps) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  let cursor = 0
  const stops = segments
    .map((s) => {
      const start = cursor
      cursor += total > 0 ? (s.value / total) * 100 : 0
      return `${s.color} ${start}% ${cursor}%`
    })
    .join(', ')
  const mask = `radial-gradient(circle, transparent ${size / 2 - thickness - 1}px, #000 ${size / 2 - thickness}px)`

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="absolute inset-0 rounded-full"
        style={{ background: total > 0 ? `conic-gradient(${stops})` : 'var(--surface-alt)', mask, WebkitMask: mask }}
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}
