import { CheckCircle, Info, WarningCircle } from '@phosphor-icons/react'
import { useCallback, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { ToastContext, type ToastInput } from './toast-context'

interface ToastItem extends ToastInput {
  id: number
}

const ICON = { success: CheckCircle, error: WarningCircle, info: Info }
const TONE = {
  success: 'border-l-success [&_svg]:text-success',
  error: 'border-l-error [&_svg]:text-error',
  info: 'border-l-secondary [&_svg]:text-secondary',
}
let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const push = useCallback((toast: ToastInput) => {
    const id = nextId++
    setToasts((current) => [...current, { ...toast, id }])
    window.setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 4500)
  }, [])

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="fixed right-5 bottom-5 z-200 flex max-w-90 flex-col gap-2.5" role="status" aria-live="polite">
        {toasts.map((toast) => {
          const tone = toast.tone ?? 'success'
          const Icon = ICON[tone]
          return (
            <div key={toast.id} className={cn('flex animate-toast-in items-start gap-2.5 rounded-xl border border-l-[3px] border-border bg-card px-3.5 py-3 shadow-toast motion-reduce:animate-none', TONE[tone])}>
              <Icon size={18} weight="fill" />
              <div>
                <p className="text-13 font-bold">{toast.title}</p>
                {toast.description && <p className="mt-0.5 text-12 text-ink-muted">{toast.description}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
