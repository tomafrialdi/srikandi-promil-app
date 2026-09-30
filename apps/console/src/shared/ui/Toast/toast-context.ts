import { createContext } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

export interface ToastInput {
  tone?: ToastTone
  title: string
  description?: string
}

export const ToastContext = createContext<((toast: ToastInput) => void) | null>(null)
