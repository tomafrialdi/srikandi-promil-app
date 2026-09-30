import { useCallback, useState } from 'react'

/** open / close state for a modal or menu. */
export function useDisclosure(initial = false) {
  const [open, setOpen] = useState(initial)
  const onOpen = useCallback(() => setOpen(true), [])
  const onClose = useCallback(() => setOpen(false), [])
  return { open, onOpen, onClose }
}
