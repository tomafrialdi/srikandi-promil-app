import { Plus, UploadSimple } from '@phosphor-icons/react'
import { Button } from '../../../shared/ui'

export function MedicationsHeader({ canEdit, onAdd }: { canEdit: boolean; onAdd: () => void }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-26 font-extrabold">Medications &amp; supplements</h1>
        <p className="text-14 text-ink-muted">Master list used by Meds log, Treatment program and reminders. Medical review required.</p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Button variant="outline" disabled title="Needs BPOM registry API access" leadingIcon={<UploadSimple size={16} />}>Import from BPOM</Button>
        {canEdit && <Button onClick={onAdd} leadingIcon={<Plus size={16} color="#fff" />}>Add medication</Button>}
      </div>
    </div>
  )
}
