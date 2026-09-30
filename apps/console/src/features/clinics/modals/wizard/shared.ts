import type { ClinicForm } from '../../types'

export interface StepProps {
  form: ClinicForm
  set: (patch: Partial<ClinicForm>) => void
}
