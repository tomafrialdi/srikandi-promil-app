/** Retention policy shown in the "Retention & integrity" card; matches the UU PDP retention schedule. */
export const RETENTION = [
  { title: 'Audit events', detail: '5 years · WORM storage (Jakarta region)' },
  { title: 'Health-data access logs', detail: '5 years · reviewed weekly by the DPO' },
  { title: 'Auth logs', detail: '1 year' },
  { title: 'Last external audit', detail: 'ISO 27001 · Mar 2026' },
]
