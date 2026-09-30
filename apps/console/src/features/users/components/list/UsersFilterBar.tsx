import { MagnifyingGlass } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { SelectField } from '../../../../shared/ui'
import { MODE_FILTER_OPTIONS, PLAN_FILTER_OPTIONS, STATUS_FILTER_OPTIONS } from '../../config/labels'
import type { UsersFilters } from '../../types'
import styles from './UsersList.module.css'

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
    <div className={styles.filterBar}>
      <label className={styles.search}>
        <MagnifyingGlass size={15} color="var(--ink-faint)" />
        <input
          className={styles.searchInput}
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
