import { Plus, X } from '@phosphor-icons/react'
import { cn } from '../../../../shared/lib/cn'
import { SelectField } from '../../../../shared/ui'
import { FIELDS, FIELD_BY_KEY, operatorsFor } from '../../engine/fields'
import type { Cond, Groups } from '../../types'
import { condIssue } from './status-form'

const SELECT = 'h-11 min-w-0 rounded-control border border-border bg-card px-3 text-13 font-semibold outline-0 focus-visible:border-primary'

interface GroupsEditorProps {
  groups: Groups
  onChange: (groups: Groups) => void
  /** "IF" for entry rules; exit rules read "IF … OR …". */
  label: string
}

function CondRow({ cond, first, onChange, onRemove }: { cond: Cond; first: boolean; onChange: (c: Cond) => void; onRemove: () => void }) {
  const def = FIELD_BY_KEY[cond.field]
  const ops = operatorsFor(def)
  const issue = condIssue(cond)
  const listId = `opts-${cond.field}`
  return (
    <div className="flex flex-col gap-1">
      <div className="grid grid-cols-[46px_minmax(0,1.2fr)_84px_minmax(0,1fr)_24px] items-center gap-2 max-[700px]:grid-cols-[46px_minmax(0,1fr)_24px]">
        <span className={cn('inline-flex h-7 items-center justify-center rounded-md text-10 font-extrabold', first ? 'bg-ink text-white' : 'bg-surface-alt text-ink-muted')}>{first ? 'IF' : 'AND'}</span>
        <SelectField triggerClassName="font-mono" aria-label="Signal" value={cond.field} options={FIELDS.map((f) => ({ value: f.key, label: f.key }))} onChange={(field) => onChange({ field, op: operatorsFor(FIELD_BY_KEY[field])[0] ?? '=', value: FIELD_BY_KEY[field]?.type === 'bool' ? 'true' : '' })} />
        <SelectField className="max-[700px]:hidden" aria-label="Operator" value={ops.includes(cond.op) ? cond.op : ops[0]!} options={ops.map((o) => ({ value: o, label: o }))} onChange={(op) => onChange({ ...cond, op })} />
        {def?.type === 'bool' ? (
          <SelectField className="max-[700px]:hidden" aria-label="Value" value={cond.value} options={[{ value: 'true', label: 'true' }, { value: 'false', label: 'false' }]} onChange={(value) => onChange({ ...cond, value })} />
        ) : (
          <>
            <input className={cn(SELECT, 'font-mono max-[700px]:hidden', issue && cond.value !== '' && 'border-error')} aria-label="Value" list={def?.type === 'enum' ? listId : undefined} placeholder={def?.type === 'enum' ? def.options?.join(' / ') : cond.op === 'between' ? '1 - 2' : 'value'} value={cond.value} onChange={(e) => onChange({ ...cond, value: e.target.value })} />
            {def?.type === 'enum' && <datalist id={listId}>{def.options?.map((o) => <option key={o} value={o} />)}</datalist>}
          </>
        )}
        <button type="button" aria-label="Remove condition" className="inline-flex size-6 items-center justify-center text-ink-faint hover:text-error" onClick={onRemove}>
          <X size={14} />
        </button>
      </div>
      {issue && cond.value !== '' && <p className="m-0 pl-[54px] text-11 font-semibold text-error">{issue}</p>}
    </div>
  )
}

/** OR of AND-groups. The first group is the main rule; extra groups are drawn as "OR group" boxes. */
export function GroupsEditor({ groups, onChange, label }: GroupsEditorProps) {
  const blank: Cond = { field: 'lh', op: '=', value: 'peak' }
  const setGroup = (gi: number, next: Cond[]) => onChange(groups.map((g, i) => (i === gi ? next : g)).filter((g) => g.length > 0))

  const renderGroup = (group: Cond[], gi: number) => (
    <div key={gi} className={cn('flex flex-col gap-2', gi > 0 && 'rounded-xl border border-purple/50 bg-card p-3')} style={gi > 0 ? { borderColor: '#6b4fbb' } : undefined}>
      {gi > 0 && <span className="text-11 font-bold" style={{ color: '#6b4fbb' }}>OR group — alternative {label === 'entry' ? 'confirmation' : 'exit'}</span>}
      {group.map((cond, ci) => (
        <CondRow key={ci} cond={cond} first={ci === 0} onChange={(c) => setGroup(gi, group.map((x, i) => (i === ci ? c : x)))} onRemove={() => setGroup(gi, group.filter((_, i) => i !== ci))} />
      ))}
      <button type="button" className="inline-flex items-center gap-1 self-start pl-1 text-11 font-bold text-primary" onClick={() => setGroup(gi, [...group, blank])}>
        <Plus size={11} weight="bold" /> AND condition
      </button>
    </div>
  )

  return (
    <div className="flex flex-col gap-3 rounded-xl bg-surface p-3.5">
      {groups.length === 0 && <p className="m-0 text-12 text-ink-muted">No {label} conditions.</p>}
      {groups.map(renderGroup)}
      <button type="button" className="inline-flex items-center gap-1 self-start text-12 font-bold text-primary" onClick={() => onChange([...groups, [blank]])}>
        <Plus size={12} weight="bold" /> {groups.length === 0 ? 'Add condition' : 'OR group'}
      </button>
    </div>
  )
}
