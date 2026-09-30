/** 12m / 2h / 3d since the timestamp. */
export function shortAge(iso: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000))
  if (minutes < 60) return `${Math.max(1, minutes)}m`
  const hours = Math.round(minutes / 60)
  return hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}d`
}

/** 8040 -> "2h 14m", 720 -> "12m" */
export function durationText(seconds: number): string {
  const m = Math.round(seconds / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  return m % 60 === 0 ? `${h}h` : `${h}h ${m % 60}m`
}

const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
const day = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })
export function messageTime(iso: string): string {
  const d = new Date(iso)
  return new Date().toDateString() === d.toDateString() ? time.format(d) : `${day.format(d)} ${time.format(d)}`
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? name
export const fillMacro = (body: string, requester: string) => body.replaceAll('{name}', firstName(requester))
