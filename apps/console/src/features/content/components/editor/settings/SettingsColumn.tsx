import { Link as LinkIcon } from '@phosphor-icons/react'
import { useCallback } from 'react'
import { useAsyncData } from '../../../../../shared/hooks/useAsyncData'
import { ChipInput, Field, SelectField, TextAreaField, Badge, CheckRow, DateField } from '../../../../../shared/ui'
import { formatCompact } from '../../../../../shared/lib/format'
import { CHECKLIST_ITEMS, DEFAULT_CATEGORIES, MODES, PHASES, PLANS, VISIBILITY_OPTIONS } from '../../../config/editor'
import { fetchAudience } from '../../../services/content.service'
import type { ContentForm, ContentOptions } from '../../../types'
import { ChipToggleGroup, EditorCard, INPUT } from '../fields'

interface SettingsColumnProps {
  form: ContentForm
  options?: ContentOptions
  set: <K extends keyof ContentForm>(key: K, value: ContentForm[K]) => void
}

export function SettingsColumn({ form, options, set }: SettingsColumnProps) {
  const categories = Array.from(new Set([...DEFAULT_CATEGORIES, ...(options?.categories ?? []), form.category])).filter(Boolean)
  const audienceFetcher = useCallback(() => fetchAudience(form.target_modes, form.target_plan), [form.target_modes, form.target_plan])
  const audience = useAsyncData(`audience-${form.target_modes.join()}-${form.target_plan}`, audienceFetcher)
  const needsReview = form.type !== 'in_app_card'
  const reviewers = Array.from(new Set([...(options?.reviewers ?? []), form.reviewer_name])).filter(Boolean)

  return (
    <aside className="flex w-full flex-none flex-col gap-4 min-[1201px]:w-90">
      <EditorCard title="Publish">
        <Field label="Visibility" htmlFor="visibility">
          <SelectField id="visibility" value={form.visibility} options={VISIBILITY_OPTIONS} onChange={(v) => set('visibility', v as ContentForm['visibility'])} />
        </Field>
        {form.type !== 'in_app_card' && (
          <Field label="Publish date" htmlFor="publish-date" hint="WIB">
            <DateField id="publish-date" withTime value={form.scheduled_at} onChange={(v) => set('scheduled_at', v)} />
          </Field>
        )}
        <Field label="Category" htmlFor="category">
          <SelectField id="category" value={form.category} options={categories.map((c) => ({ value: c, label: c }))} onChange={(v) => set('category', v)} />
        </Field>
        <Field label="Tags">
          <ChipInput values={form.tags} onChange={(v) => set('tags', v)} placeholder="Add a tag and press Enter" />
        </Field>
        <Field label="Languages" hint="Where this is available">
          <ChipToggleGroup
            label="Languages"
            options={[{ value: 'en', label: 'English' }, { value: 'id', label: 'Bahasa' }]}
            selected={form.languages}
            onChange={(next) => next.length > 0 && set('languages', next as ContentForm['languages'])}
          />
        </Field>
      </EditorCard>

      <EditorCard title="Personalised targeting" badge={<Badge tone="primary">{audience.data != null ? `~${formatCompact(audience.data)} users` : '…'}</Badge>}>
        <Field label="Cycle phase">
          <ChipToggleGroup label="Cycle phase" options={PHASES} selected={form.target_phases} onChange={(v) => set('target_phases', v)} />
        </Field>
        <Field label="Tracking mode">
          <ChipToggleGroup label="Tracking mode" options={MODES} selected={form.target_modes} onChange={(v) => set('target_modes', v)} />
        </Field>
        <Field label="Plan">
          <ChipToggleGroup single label="Plan" options={PLANS} selected={[form.target_plan]} onChange={([v]) => set('target_plan', (v ?? 'all') as ContentForm['target_plan'])} />
        </Field>
        <p className="text-11 text-ink-faint">Nothing selected = everyone. The user estimate counts tracking mode and plan.</p>
      </EditorCard>

      <EditorCard title="Medical review" badge={<Badge tone={needsReview ? 'warning' : 'neutral'}>{needsReview ? 'Required' : 'Not required'}</Badge>}>
        {needsReview ? (
          <>
            <Field label="Reviewer" htmlFor="reviewer">
              <SelectField id="reviewer" value={form.reviewer_name} options={[{ value: '', label: 'Choose a reviewer' }, ...reviewers.map((r) => ({ value: r, label: r }))]} onChange={(v) => set('reviewer_name', v)} />
            </Field>
            <p className="text-11 text-ink-faint">SLA 48h once submitted.</p>
            <div className="flex flex-col gap-2">
              {CHECKLIST_ITEMS.map((item) => (
                <CheckRow key={item.key} checked={form.checklist[item.key]} onChange={(v) => set('checklist', { ...form.checklist, [item.key]: v })} title={item.label} />
              ))}
            </div>
          </>
        ) : (
          <p className="text-12 text-ink-muted">Promotional in-app cards do not need medical review.</p>
        )}
      </EditorCard>

      {form.type === 'article' && (
        <EditorCard title="SEO (website)">
          <Field label="URL slug" htmlFor="slug" hint="must start with /">
            <div className="relative flex items-center">
              <input id="slug" className={INPUT} value={form.slug} placeholder="/blog/my-article" onChange={(e) => set('slug', e.target.value)} />
              <LinkIcon size={15} className="pointer-events-none absolute right-3 text-ink-faint" />
            </div>
          </Field>
          <Field label="Meta description" hint={`${form.meta_description.length}/160`}>
            <TextAreaField maxLength={160} value={form.meta_description} onChange={(e) => set('meta_description', e.target.value)} placeholder="Shown in search results." />
          </Field>
        </EditorCard>
      )}
    </aside>
  )
}
