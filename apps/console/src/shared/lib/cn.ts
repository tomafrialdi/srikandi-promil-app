import { extendTailwindMerge } from 'tailwind-merge'

const FONT_SIZES = ['9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '22', '24', '26', '28', '38']
const COLORS = [
  'primary', 'primary-soft', 'secondary', 'secondary-soft', 'surface', 'surface-alt', 'card', 'ink', 'ink-muted', 'ink-faint',
  'border', 'success', 'success-soft', 'warning', 'warning-soft', 'warning-ink', 'error', 'error-soft', 'pink', 'purple',
]

// Teach tailwind-merge about our theme (custom text-13 sizes and named colours) so overrides resolve predictably.
const twMerge = extendTailwindMerge({
  extend: {
    theme: { color: COLORS, text: FONT_SIZES },
  },
})

/** Join class names (skipping falsy values) and resolve Tailwind conflicts: cn('p-5', cond && 'p-4') → 'p-4'. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return twMerge(parts.filter(Boolean).join(' '))
}
