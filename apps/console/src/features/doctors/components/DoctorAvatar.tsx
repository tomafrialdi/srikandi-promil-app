import { cn } from '../../../shared/lib/cn'
import { initials } from '../lib/doctor-form'

const TINTS = ['#f6dee6', '#dceaf9', '#e1f1e3', '#fbefd9', '#e9e3f8']

export function DoctorAvatar({ name, url, size = 56, className }: { name: string; url: string | null; size?: number; className?: string }) {
  const tint = TINTS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % TINTS.length]
  return url ? (
    <img src={url} alt="" width={size} height={size} className={cn('flex-none rounded-full object-cover', className)} style={{ width: size, height: size }} />
  ) : (
    <span className={cn('inline-flex flex-none items-center justify-center rounded-full font-extrabold text-ink/70', className)} style={{ width: size, height: size, background: tint, fontSize: size * 0.4 }} aria-hidden="true">
      {initials(name)}
    </span>
  )
}
