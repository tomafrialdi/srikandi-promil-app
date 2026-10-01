import { useState } from 'react'
import { cn } from '../../lib/cn'

interface AvatarProps {
  label: string
  size?: number
  tone?: 'primary' | 'secondary'
  /** Photo URL. The initials in `label` are shown when it is missing or fails to load. */
  src?: string | null
}

const TONE = {
  primary: 'bg-primary text-white',
  secondary: 'bg-secondary-soft text-secondary',
}

export function Avatar({ label, size = 32, tone = 'secondary', src }: AvatarProps) {
  // Remember which URL failed, so a new URL gets a fresh attempt.
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (src && src !== failedSrc) {
    return (
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        onError={() => setFailedSrc(src)}
        className="shrink-0 rounded-full bg-secondary-soft object-cover"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <span
      className={cn('inline-flex shrink-0 items-center justify-center rounded-full font-bold', TONE[tone], size >= 60 ? 'text-24 font-extrabold' : size >= 34 ? 'text-13' : 'text-12')}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {label}
    </span>
  )
}
