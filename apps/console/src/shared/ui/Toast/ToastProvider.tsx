import { CheckCircle, Info, WarningCircle } from '@phosphor-icons/react'
import { useCallback, useState, type ReactNode } from 'react'
import { ToastContext, type ToastInput } from './toast-context'
import styles from './Toast.module.css'

interface ToastItem extends ToastInput {
  id: number
}

const ICON = { success: CheckCircle, error: WarningCircle, info: Info }
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
      <div className={styles.stack} role="status" aria-live="polite">
        {toasts.map((toast) => {
          const tone = toast.tone ?? 'success'
          const Icon = ICON[tone]
          return (
            <div key={toast.id} className={`${styles.toast} ${styles[tone]}`}>
              <Icon size={18} weight="fill" />
              <div>
                <p className={styles.title}>{toast.title}</p>
                {toast.description && <p className={styles.description}>{toast.description}</p>}
              </div>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
