import type { ComponentProps } from 'react'
import { cn } from '../../lib/cn'

export function TextAreaField({ className, ...rest }: ComponentProps<'textarea'>) {
  return (
    <textarea
      className={cn(
        'min-h-21 w-full resize-y rounded-control border border-border bg-card px-3.5 py-3 text-13 leading-normal font-medium outline-0 placeholder:text-ink-faint focus-visible:border-primary',
        className,
      )}
      {...rest}
    />
  )
}
