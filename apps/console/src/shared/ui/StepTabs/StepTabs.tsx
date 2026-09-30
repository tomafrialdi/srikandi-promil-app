import { Check } from '@phosphor-icons/react'
import { cn } from '../../lib/cn'

interface Step {
  key: string
  label: string
}

interface StepTabsProps {
  steps: Step[]
  /** 0-based index of the active step. */
  current: number
  /** Called for steps that are already completed. */
  onSelect?: (index: number) => void
}

/** Numbered wizard header: completed steps get a check and are clickable. */
export function StepTabs({ steps, current, onSelect }: StepTabsProps) {
  return (
    <nav className="flex flex-none gap-6 overflow-x-auto border-b border-border px-6" aria-label="Steps">
      {steps.map((step, index) => {
        const done = index < current
        const active = index === current
        return (
          <button
            key={step.key}
            type="button"
            className={cn(
              '-mb-px inline-flex items-center gap-2 border-b-2 border-transparent py-3 text-13 font-semibold whitespace-nowrap disabled:cursor-default',
              active ? 'border-primary font-bold text-primary' : done ? 'text-ink' : 'text-ink-muted',
            )}
            aria-current={active ? 'step' : undefined}
            disabled={!done}
            onClick={() => onSelect?.(index)}
          >
            <span
              className={cn(
                'inline-flex size-5 items-center justify-center rounded-full text-10 font-extrabold',
                active ? 'bg-primary text-white' : done ? 'bg-success text-white' : 'bg-surface-alt text-ink-muted',
              )}
            >
              {done ? <Check size={11} weight="bold" /> : index + 1}
            </span>
            {step.label}
          </button>
        )
      })}
    </nav>
  )
}
