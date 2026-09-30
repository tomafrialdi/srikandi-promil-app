import { Check } from '@phosphor-icons/react'
import styles from './StepTabs.module.css'

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
    <nav className={styles.tabs} aria-label="Steps">
      {steps.map((step, index) => {
        const done = index < current
        const active = index === current
        return (
          <button
            key={step.key}
            type="button"
            className={`${styles.step} ${active ? styles.active : ''} ${done ? styles.done : ''}`}
            aria-current={active ? 'step' : undefined}
            disabled={!done}
            onClick={() => onSelect?.(index)}
          >
            <span className={styles.badge}>{done ? <Check size={11} weight="bold" /> : index + 1}</span>
            {step.label}
          </button>
        )
      })}
    </nav>
  )
}
