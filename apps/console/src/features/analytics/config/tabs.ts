export interface AnalyticsTab {
  key: string
  label: string
  /** Path relative to /analytics ('' = index). */
  path: string
}

export const ANALYTICS_TABS: AnalyticsTab[] = [
  { key: 'overview', label: 'Overview', path: '' },
  { key: 'retention', label: 'Retention', path: 'retention' },
  { key: 'engagement', label: 'Engagement', path: 'engagement' },
  { key: 'acquisition', label: 'Acquisition', path: 'acquisition' },
  { key: 'health-outcomes', label: 'Health outcomes', path: 'health-outcomes' },
  { key: 'revenue', label: 'Revenue', path: 'revenue' },
]
