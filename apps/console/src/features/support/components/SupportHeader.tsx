import { Lightning, Plus } from '@phosphor-icons/react'
import { Button } from '../../../shared/ui'

export function SupportHeader({ canAct, onMacros, onNew }: { canAct: boolean; onMacros: () => void; onNew: () => void }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-26 font-extrabold">Support tickets</h1>
        <p className="text-14 text-ink-muted">From in-app help, website contact form and WhatsApp.</p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Button variant="outline" onClick={onMacros} leadingIcon={<Lightning size={16} />}>Macros</Button>
        {canAct && <Button onClick={onNew} leadingIcon={<Plus size={16} color="#fff" />}>New ticket</Button>}
      </div>
    </div>
  )
}
