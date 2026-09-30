import { ShieldCheck, UserPlus } from '@phosphor-icons/react'
import { Button } from '../../../shared/ui'

interface DoctorsHeaderProps {
  canEdit: boolean
  canVerify: boolean
  pending: number
  onVerify: () => void
  onAdd: () => void
}

export function DoctorsHeader({ canEdit, canVerify, pending, onVerify, onAdd }: DoctorsHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-26 font-extrabold">Doctors &amp; specialists</h1>
        <p className="text-14 text-ink-muted">Profiles shown in Find a specialist, teleconsult and medical review.</p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        {canVerify && (
          <Button variant="outline" onClick={onVerify} leadingIcon={<ShieldCheck size={16} />}>
            Verify STR (KKI){pending > 0 && <span className="ml-1 rounded-full bg-warning-soft px-1.5 py-px text-11 font-bold text-warning-ink">{pending}</span>}
          </Button>
        )}
        {canEdit && <Button onClick={onAdd} leadingIcon={<UserPlus size={16} color="#fff" />}>Add doctor</Button>}
      </div>
    </div>
  )
}
