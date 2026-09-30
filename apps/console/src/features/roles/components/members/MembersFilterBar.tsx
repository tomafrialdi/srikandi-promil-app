import { MagnifyingGlass } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { SelectField } from '../../../../shared/ui'
import { TFA_FILTER_OPTIONS } from '../../config/members'
import type { MembersFilters, MembersSummary } from '../../types'
import type { RoleCatalog } from '../../../users/types'

export type MemberFilterKey = 'tab' | 'search' | 'role' | 'department' | 'tfa'

interface MembersFilterBarProps {
  filters: MembersFilters
  departments: MembersSummary['departments']
  roles: RoleCatalog['roles']
  onChange: (key: MemberFilterKey, value: string) => void
}

export function MembersFilterBar({ filters, departments, roles, onChange }: MembersFilterBarProps) {
  const [draft, setDraft] = useState(filters.search)

  useEffect(() => {
    if (draft === filters.search) return
    const id = window.setTimeout(() => onChange('search', draft.trim()), 300)
    return () => window.clearTimeout(id)
  }, [draft, filters.search, onChange])

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <label className="flex h-9 w-70 max-w-full items-center gap-2 rounded-lg bg-surface px-3 focus-within:outline focus-within:outline-primary">
        <MagnifyingGlass size={15} color="var(--ink-faint)" />
        <input
          className="min-w-0 flex-1 border-0 bg-transparent text-13 outline-0 placeholder:text-ink-faint"
          placeholder="Search name or email"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-label="Search team members"
        />
      </label>
      <SelectField variant="pill" aria-label="Role" value={filters.role} options={[{ value: '', label: 'Role: All' }, ...roles.map((r) => ({ value: r.role, label: r.label }))]} onChange={(v) => onChange('role', v)} />
      <SelectField variant="pill" aria-label="Department" value={filters.department} options={[{ value: '', label: 'Department: All' }, ...departments.map((d) => ({ value: d, label: d }))]} onChange={(v) => onChange('department', v)} />
      <SelectField variant="pill" aria-label="2FA" value={filters.tfa} options={TFA_FILTER_OPTIONS} onChange={(v) => onChange('tfa', v)} />
    </div>
  )
}
