import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DEFAULT_RANGE, isRangePreset, resolveRange, type DateRange, type RangePresetKey } from '../config/date-range'

/** The selected range lives in the URL (?range=30d) so tabs, reloads and shared links agree. */
export function useDateRange(): [DateRange, (preset: RangePresetKey) => void] {
  const [params, setParams] = useSearchParams()
  const raw = params.get('range')
  const preset = isRangePreset(raw) ? raw : DEFAULT_RANGE
  const range = useMemo(() => resolveRange(preset), [preset])

  const setPreset = (next: RangePresetKey) => {
    const nextParams = new URLSearchParams(params)
    if (next === DEFAULT_RANGE) nextParams.delete('range')
    else nextParams.set('range', next)
    setParams(nextParams, { replace: true })
  }

  return [range, setPreset]
}
