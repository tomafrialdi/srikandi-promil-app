const TZ = 'Asia/Jakarta'
const clock = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
const hm = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false })
const day = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: 'numeric', month: 'short' })
const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: TZ })
const full = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })

const sameDay = (d: Date) => dayKey.format(d) === dayKey.format(new Date())

/** Today → 07:02:10, earlier → 20 May 22:40. */
export function eventTime(iso: string): string {
  const d = new Date(iso)
  return sameDay(d) ? clock.format(d) : `${day.format(d)} ${hm.format(d)}`
}

/** 21 May 2026 06:58:22 WIB */
export const fullTime = (iso: string) => `${full.format(new Date(iso))} WIB`

export const timeOnly = (iso: string) => hm.format(new Date(iso))
export const dayMonth = (iso: string) => day.format(new Date(iso))
export const dayTime = (iso: string) => (sameDay(new Date(iso)) ? hm.format(new Date(iso)) : `${day.format(new Date(iso))} ${hm.format(new Date(iso))}`)

export const daysLeft = (iso: string) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)

/** 7f3a91c0…d4e2c91e */
export const shortHash = (hash: string | null) => (hash ? `${hash.slice(0, 8)}…${hash.slice(-8)}` : '—')

/** 372 → "6 min 12 s" */
export function spanText(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m} min ${s} s` : `${s} s`
}

/** usr_8f21k9 → usr_••••k9, used when an export pseudonymises people. */
export const maskRef = (value: string | null) => (value ? value.replace(/usr_([a-z0-9]+)/gi, (_, id: string) => `usr_••••${id.slice(-2)}`) : value)

export const localDateInput = (d: Date) => new Intl.DateTimeFormat('en-CA').format(d)
