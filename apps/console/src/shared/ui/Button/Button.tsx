import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'danger'
  /** Full-width, 50px tall (auth forms). */
  block?: boolean
  leadingIcon?: ReactNode
  trailingIcon?: ReactNode
}

const VARIANT = {
  primary: 'bg-primary text-white',
  outline: 'border border-border bg-card text-ink',
  danger: 'bg-error-soft text-error',
}

export function Button({
  variant = 'primary',
  block = false,
  leadingIcon,
  trailingIcon,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-control px-3.5 py-[9px] text-13 font-bold whitespace-nowrap transition-opacity',
        'hover:not-disabled:opacity-90 disabled:opacity-55',
        VARIANT[variant],
        block && 'h-[50px] w-full gap-3 px-3.5 py-0 text-14',
        block && variant === 'primary' && 'rounded-lg text-15 font-extrabold',
        className,
      )}
      {...rest}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  )
}
