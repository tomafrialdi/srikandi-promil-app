import { cn } from '../../lib/cn'

interface AvatarProps {
  label: string
  size?: number
  tone?: 'primary' | 'secondary'
}

const TONE = {
  primary: 'bg-primary text-white',
  secondary: 'bg-secondary-soft text-secondary',
}

export function Avatar({ label, size = 32, tone = 'secondary' }: AvatarProps) {
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
