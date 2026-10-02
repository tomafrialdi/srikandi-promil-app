import type { ContentForm, ContentType } from '../types'

export const DEFAULT_CATEGORIES = ['Fertility', 'Emotional', 'Tracking', 'PCOS', 'Treatment', 'Partner', 'Nutrition', 'Product']

export const VISIBILITY_OPTIONS = [
  { value: 'app_web', label: 'App + Website' },
  { value: 'app', label: 'App only' },
  { value: 'web', label: 'Website only' },
]

export const PHASES = ['Menstrual', 'Follicular', 'Fertile', '2WW', 'Pregnant']
export const MODES = [
  { value: 'ttc', label: 'TTC' },
  { value: 'pcos', label: 'PCOS' },
  { value: 'iui', label: 'IUI/IVF' },
  { value: 'after_loss', label: 'After loss' },
]
export const PLANS = [
  { value: 'all', label: 'All' },
  { value: 'free', label: 'Free only' },
  { value: 'plus', label: 'Plus only' },
]

export const TIP_ICONS = ['thermometer', 'drop', 'heart', 'moon', 'apple', 'pill']
export const TAP_ACTIONS = ['Open article', 'Open a screen', 'Nothing']
export const ROTATION_OPTIONS = ['In pool · max 1× per 14 days / user', 'In pool · max 1× per 30 days / user', 'Pinned for its cycle days']
export const PRIORITY_OPTIONS = ['Normal', 'High (over tips)', 'Low']

export const CARD_LAYOUTS = [
  { value: 'banner', label: 'Banner' },
  { value: 'hero', label: 'Hero card' },
  { value: 'bottom_sheet', label: 'Bottom sheet' },
  { value: 'inline_list', label: 'Inline list' },
]
export const CARD_SCREENS = ['Home · below cycle card', 'Calendar', 'Two-week wait', 'Log today sheet', 'Insights']

export const VIDEO_PLACEMENTS = ['Home', 'Treatment program screen', 'Articles & videos feed', 'Two-week wait', 'Website /blog']
export const CAPTION_LANGS = ['Bahasa Indonesia', 'English']

export const CHECKLIST_ITEMS: Array<{ key: keyof ContentForm['checklist']; label: string }> = [
  { key: 'references', label: '2 references cited' },
  { key: 'claims', label: 'No treatment claims without source' },
  { key: 'reading', label: 'Reading level ≤ grade 8' },
]

export const TYPE_HEADING: Record<ContentType, { title: string; subtitle: string; submit: string }> = {
  article: { title: 'New article', subtitle: 'Draft · long-form content for the app and website', submit: 'Submit for medical review' },
  daily_tip: { title: 'New daily tip', subtitle: 'Short, evidence-based tips shown on Home · 1 per day per user', submit: 'Submit for medical review' },
  in_app_card: { title: 'New in-app card', subtitle: 'Promotional or educational cards placed inside app screens', submit: 'Schedule card' },
  video: { title: 'New video', subtitle: 'Short educational videos · auto-captioned · medical review required', submit: 'Submit for medical review' },
}

export const EMPTY_VARIANT = { title: '', body: '', cta_label: '', deep_link: '', weight: 50 }

export function emptyForm(type: ContentType): ContentForm {
  return {
    type,
    title: '',
    slug: '',
    category: 'Fertility',
    tags: [],
    languages: ['en'],
    visibility: 'app_web',
    scheduled_at: '',
    image_url: '',
    cover_alt: '',
    dek: '',
    body: '',
    meta_description: '',
    target_phases: [],
    target_modes: [],
    target_plan: 'all',
    reviewer_name: '',
    checklist: { references: false, claims: false, reading: false },
    video_url: '',
    duration_seconds: null,
    tip_icon: 'thermometer',
    tap_action: 'Open article',
    deep_link: '',
    source_ref: '',
    cycle_days: [],
    rotation: ROTATION_OPTIONS[0]!,
    priority: 'Normal',
    layout: 'hero',
    variants: [{ ...EMPTY_VARIANT, weight: 100 }],
    screens: [CARD_SCREENS[0]!],
    frequency_cap: 3,
    run_from: '',
    run_to: '',
    dismissible: true,
    hide_after_conversion: true,
    discreet_mode: false,
    presenter: '',
    chapters: [],
    captions: [],
    transcript: '',
    placement: [],
    autoplay_muted: true,
  }
}
