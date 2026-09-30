import { Plus, UploadSimple } from '@phosphor-icons/react'
import { Button } from '../../../shared/ui'

export function ClinicsHeader({ canEdit, onImport, onAdd }: { canEdit: boolean; onImport: () => void; onAdd: () => void }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-26 font-extrabold">Clinics &amp; specialists</h1>
        <p className="text-14 text-ink-muted">Directory shown in “Find a specialist”. Verify licences before listing.</p>
      </div>
      {canEdit && (
        <div className="flex flex-wrap gap-2.5">
          <Button variant="outline" onClick={onImport} leadingIcon={<UploadSimple size={16} />}>Import CSV</Button>
          <Button onClick={onAdd} leadingIcon={<Plus size={16} color="#fff" />}>Add clinic</Button>
        </div>
      )}
    </div>
  )
}
