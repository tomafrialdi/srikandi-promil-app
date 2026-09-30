import { createElement } from 'react'
import { ICONS } from '../config/palette'
import { Pulse } from '@phosphor-icons/react'

/** Renders a stored icon name (avoids creating a component variable during render). */
export function StatusIcon({ name, size = 16, className }: { name: string; size?: number; className?: string }) {
  return createElement(ICONS[name] ?? Pulse, { size, className })
}
