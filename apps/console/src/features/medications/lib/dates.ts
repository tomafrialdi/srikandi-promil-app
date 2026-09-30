const fmt = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
export const fmtDateShort = (iso: string | null) => (iso ? fmt.format(new Date(iso)) : '—')
