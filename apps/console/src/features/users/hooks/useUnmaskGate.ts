import { useCallback, useState } from 'react'

/**
 * Health data opens in two steps: ask for a reason (logged server-side), then show the modal.
 * `ask(arg)` opens the reason dialog; `dialog` props plug into <ReasonDialog>; `data` feeds the modal.
 */
export function useUnmaskGate<T>(load: (arg: string, reason: string) => Promise<T>) {
  const [pending, setPending] = useState<string | null>(null)
  const [data, setData] = useState<T | null>(null)

  const ask = useCallback((arg: string) => setPending(arg), [])
  const cancel = useCallback(() => setPending(null), [])
  const closeModal = useCallback(() => setData(null), [])

  const confirm = useCallback(
    async (reason: string) => {
      if (pending === null) return
      setData(await load(pending, reason))
    },
    [load, pending],
  )

  return { ask, closeModal, data, dialog: { open: pending !== null, onClose: cancel, onConfirm: confirm } }
}
