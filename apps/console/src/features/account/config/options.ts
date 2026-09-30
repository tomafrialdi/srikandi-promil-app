export const TOKEN_SCOPES = [
  { key: 'analytics:read', description: 'KPIs, funnels, cohorts (aggregated)' },
  { key: 'subscriptions:read', description: 'Plans, MRR, transactions (no card data)' },
  { key: 'users:read', description: 'Profiles without health data' },
  { key: 'content:write', description: 'Create & edit drafts' },
] as const

export const UNAVAILABLE_SCOPE = { key: 'health:read', description: 'Not available for tokens' }

export const TOKEN_EXPIRY_OPTIONS = [
  { value: '30', label: 'In 30 days' },
  { value: '90', label: 'In 90 days' },
  { value: '180', label: 'In 180 days' },
  { value: '365', label: 'In 1 year' },
]

export const LANDING_OPTIONS = [
  { value: '/', label: 'Dashboard' },
  { value: '/analytics', label: 'Analytics' },
  { value: '/users', label: 'Users' },
  { value: '/subscriptions', label: 'Subscriptions' },
  { value: '/articles', label: 'Content library' },
  { value: '/notifications', label: 'Notifications' },
  { value: '/community', label: 'Community' },
]

export const DATE_RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '180d', label: 'Last 180 days' },
]

export const LANGUAGE_OPTIONS = ['English', 'Bahasa Indonesia'].map((v) => ({ value: v, label: v }))
export const TIMEZONE_OPTIONS = [
  { value: 'Asia/Jakarta', label: 'Asia/Jakarta (WIB, UTC+7)' },
  { value: 'Asia/Makassar', label: 'Asia/Makassar (WITA, UTC+8)' },
  { value: 'Asia/Jayapura', label: 'Asia/Jayapura (WIT, UTC+9)' },
]
export const DATE_FORMAT_OPTIONS = [
  { value: 'd MMM yyyy', label: '21 May 2026' },
  { value: 'dd/MM/yyyy', label: '21/05/2026' },
  { value: 'yyyy-MM-dd', label: '2026-05-21' },
]
export const CURRENCY_OPTIONS = [{ value: 'IDR', label: 'IDR · Rp 1.234.567' }]

export const PASSWORD_RULES = [
  { key: 'length', label: 'At least 14 characters', test: (v: string) => v.length >= 14 },
  { key: 'case', label: 'Upper & lower case letters', test: (v: string) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { key: 'symbol', label: 'A number or symbol', test: (v: string) => /[0-9]|[^A-Za-z0-9]/.test(v) },
]
