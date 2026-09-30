import { ArrowUpRight } from '@phosphor-icons/react'

/** "Open meds log ↗" link at the right of a card header. */
export function CardLink({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button type="button" className="inline-flex items-center gap-1 text-12 font-bold text-primary" onClick={onClick}>
      {children}
      <ArrowUpRight size={13} weight="bold" />
    </button>
  )
}
