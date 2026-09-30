import { MagnifyingGlass } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { SelectField } from '../../../../shared/ui'
import { cn } from '../../../../shared/lib/cn'
import { LANG_FILTER_OPTIONS, TYPE_FILTERS, TYPE_META } from '../../config/labels'
import type { ContentFilters, ContentSummary, ContentType } from '../../types'

type FilterKey = 'search' | 'type' | 'category' | 'reviewer' | 'lang'

interface ContentFilterBarProps {
  filters: ContentFilters
  summary?: ContentSummary
  onChange: (key: FilterKey, value: string) => void
}

export function ContentFilterBar({ filters, summary, onChange }: ContentFilterBarProps) {
  const [draft, setDraft] = useState(filters.search)

  useEffect(() => {
    if (draft === filters.search) return
    const id = window.setTimeout(() => onChange('search', draft.trim()), 300)
    return () => window.clearTimeout(id)
  }, [draft, filters.search, onChange])

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <label className="flex h-9 w-60 max-w-full items-center gap-2 rounded-lg bg-surface px-3 focus-within:outline focus-within:outline-primary">
        <MagnifyingGlass size={15} color="var(--ink-faint)" />
        <input
          className="min-w-0 flex-1 border-0 bg-transparent text-13 outline-0 placeholder:text-ink-faint"
          placeholder="Search title, slug or tag"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          aria-label="Search content"
        />
      </label>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Content type">
        {TYPE_FILTERS.map((option) => {
          const Icon = option.value ? TYPE_META[option.value as ContentType].icon : null
          const active = filters.type === option.value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              className={cn(
                'inline-flex h-[27px] items-center gap-1.5 rounded-full border px-2.5 text-12 font-semibold',
                active ? 'border-primary bg-primary-soft text-primary' : 'border-border bg-card text-ink-muted',
              )}
              onClick={() => onChange('type', option.value)}
            >
              {Icon && <Icon size={13} />}
              {option.label}
            </button>
          )
        })}
      </div>

      <SelectField
        variant="pill"
        aria-label="Category"
        value={filters.category}
        options={[{ value: '', label: 'Category' }, ...(summary?.categories ?? []).map((c) => ({ value: c, label: c }))]}
        onChange={(v) => onChange('category', v)}
      />
      <SelectField
        variant="pill"
        aria-label="Reviewer"
        value={filters.reviewer}
        options={[{ value: '', label: 'Reviewer' }, ...(summary?.reviewers ?? []).map((r) => ({ value: r, label: r }))]}
        onChange={(v) => onChange('reviewer', v)}
      />
      <SelectField variant="pill" aria-label="Language" value={filters.lang} options={LANG_FILTER_OPTIONS} onChange={(v) => onChange('lang', v)} />
    </div>
  )
}
