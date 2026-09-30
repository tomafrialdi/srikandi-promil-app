import { MagnifyingGlass } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { SelectField } from '../../../../shared/ui'
import { MODE_FILTER_OPTIONS, PLAN_FILTER_OPTIONS, STATUS_FILTER_OPTIONS } from '../../config/labels'
import type { UsersFilters } from '../../types'

interface UsersFilterBarProps {
  filters: UsersFilters
  cities: string[]
  onChange: (key: 'search' | 'plan' | 'mode' | 'city' | 'status', value: string) => void
}

export function UsersFilterBar({ filters, cities, onChange }: UsersFilterBarProps) {
  const [draft, setDraft] = useState(filters.search)

  // Debounce typing so we do not query on every keystroke.
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
          placeholder="Search name, email or ID"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-label="Search users"
        />
      </label>
      <SelectField variant="pill" aria-label="Plan" value={filters.plan} options={PLAN_FILTER_OPTIONS} onChange={(v) => onChange('plan', v)} />
      <SelectField variant="pill" aria-label="Mode" value={filters.mode} options={MODE_FILTER_OPTIONS} onChange={(v) => onChange('mode', v)} />
      <SelectField
        variant="pill"
        aria-label="City"
        value={filters.city}
        options={[{ value: '', label: 'City: All' }, ...cities.map((c) => ({ value: c, label: c }))]}
        onChange={(v) => onChange('city', v)}
      />
      <SelectField variant="pill" aria-label="Status" value={filters.status} options={STATUS_FILTER_OPTIONS} onChange={(v) => onChange('status', v)} />
    </div>
  )
}
