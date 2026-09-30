import { emptyForm, EMPTY_VARIANT } from '../config/editor'
import type { CardVariant, Chapter, ContentForm, ContentRecord } from '../types'

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback)
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])

/** ISO timestamp -> value for <input type="datetime-local"> in local time. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function recordToForm(record: ContentRecord): ContentForm {
  const d = record.details
  const base = emptyForm(record.type)
  return {
    ...base,
    title: record.title,
    slug: record.slug ?? '',
    category: record.category,
    tags: record.tags,
    languages: record.languages,
    visibility: record.visibility,
    scheduled_at: toLocalInput(record.scheduled_at),
    image_url: record.image_url ?? '',
    cover_alt: record.cover_alt ?? '',
    dek: record.dek ?? '',
    body: record.body ?? '',
    meta_description: record.meta_description ?? '',
    target_phases: record.target_phases,
    target_modes: record.target_modes,
    target_plan: record.target_plan,
    reviewer_name: record.reviewer_name ?? '',
    checklist: { ...base.checklist, ...record.checklist },
    video_url: record.video_url ?? '',
    duration_seconds: record.duration_seconds,
    tip_icon: str(d.icon, base.tip_icon),
    tap_action: str(d.tap_action, base.tap_action),
    deep_link: str(d.deep_link),
    source_ref: str(d.source_ref),
    cycle_days: arr<number>(d.cycle_days),
    rotation: str(d.rotation, base.rotation),
    priority: str(d.priority, base.priority),
    layout: str(d.layout, base.layout) as ContentForm['layout'],
    variants: arr<CardVariant>(d.variants).length > 0 ? arr<CardVariant>(d.variants) : base.variants,
    screens: arr<string>(d.screens).length > 0 ? arr<string>(d.screens) : record.type === 'in_app_card' ? [] : base.screens,
    frequency_cap: typeof d.frequency_cap === 'number' ? d.frequency_cap : base.frequency_cap,
    run_from: str(d.run_from),
    run_to: str(d.run_to),
    dismissible: d.dismissible !== false,
    hide_after_conversion: d.hide_after_conversion !== false,
    discreet_mode: d.discreet_mode === true,
    presenter: str(d.presenter),
    chapters: arr<Chapter>(d.chapters),
    captions: arr<string>(d.captions),
    transcript: str(d.transcript),
    placement: arr<string>(d.placement),
    autoplay_muted: d.autoplay_muted !== false,
  }
}

/** Short descriptor stored in `context`: shows under the title in the library. */
function contextOf(f: ContentForm): string | null {
  if (f.type === 'daily_tip') return f.target_phases[0]?.toLowerCase() ?? f.category.toLowerCase()
  if (f.type === 'in_app_card') return f.screens[0]?.toLowerCase().replace(/ · /g, ' ') ?? null
  if (f.type === 'video') return f.category.toLowerCase()
  return null
}

export function formToPayload(f: ContentForm): Record<string, unknown> {
  const first = f.variants[0] ?? EMPTY_VARIANT
  const details: Record<string, unknown> =
    f.type === 'daily_tip'
      ? { icon: f.tip_icon, tap_action: f.tap_action, deep_link: f.deep_link, source_ref: f.source_ref, cycle_days: f.cycle_days, rotation: f.rotation, priority: f.priority }
      : f.type === 'in_app_card'
        ? {
            layout: f.layout, variants: f.variants, screens: f.screens, frequency_cap: f.frequency_cap, priority: f.priority,
            run_from: f.run_from, run_to: f.run_to, dismissible: f.dismissible, hide_after_conversion: f.hide_after_conversion, discreet_mode: f.discreet_mode,
          }
        : f.type === 'video'
          ? { presenter: f.presenter, chapters: f.chapters, captions: f.captions, transcript: f.transcript, placement: f.placement, autoplay_muted: f.autoplay_muted }
          : {}

  const scheduled = f.type === 'in_app_card' && f.run_from ? new Date(`${f.run_from}T00:00`).toISOString() : f.scheduled_at ? new Date(f.scheduled_at).toISOString() : null

  return {
    type: f.type,
    title: (f.type === 'in_app_card' ? first.title : f.title).trim(),
    slug: f.type === 'article' ? f.slug.trim() : null,
    context: contextOf(f),
    category: f.category,
    tags: f.tags,
    languages: f.languages,
    visibility: f.visibility,
    scheduled_at: scheduled,
    image_url: f.image_url || null,
    cover_alt: f.cover_alt,
    dek: f.dek,
    body: f.type === 'daily_tip' ? f.body : f.type === 'in_app_card' ? first.body : f.body,
    meta_description: f.meta_description || null,
    target_phases: f.target_phases,
    target_modes: f.target_modes,
    target_plan: f.target_plan,
    reviewer_name: f.type === 'in_app_card' ? null : f.reviewer_name || null,
    checklist: f.checklist,
    video_url: f.video_url || null,
    duration_seconds: f.duration_seconds,
    details,
  }
}
