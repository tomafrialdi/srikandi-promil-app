import { cn } from '../../../../shared/lib/cn'
import type { ContentStatus } from '../../types'

const STEPS = ['Draft', 'Medical review', 'Scheduled', 'Published']

function currentStep(status: ContentStatus | null): number {
  if (status === 'medical_review') return 1
  if (status === 'scheduled') return 2
  if (status === 'published') return 3
  return 0
}

export function WorkflowSteps({ status }: { status: ContentStatus | null }) {
  const current = currentStep(status)
  return (
    <ol className="flex items-center gap-3 overflow-x-auto rounded-card border border-border bg-card px-5 py-3.5" aria-label="Publishing workflow">
      {STEPS.map((label, index) => (
        <li key={label} className="flex min-w-0 flex-1 items-center gap-3 last:flex-none">
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <span
              className={cn(
                'inline-flex size-6 items-center justify-center rounded-full text-11 font-bold',
                index <= current ? 'bg-primary text-white' : 'bg-surface-alt text-ink-muted',
              )}
            >
              {index + 1}
            </span>
            <span className={cn('text-13 font-semibold', index === current ? 'text-ink' : 'text-ink-muted')}>{label}</span>
          </span>
          {index < STEPS.length - 1 && <span className={cn('h-0.5 min-w-6 flex-1 rounded', index < current ? 'bg-primary' : 'bg-border')} aria-hidden="true" />}
        </li>
      ))}
    </ol>
  )
}
