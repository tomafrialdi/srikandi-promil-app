import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePreferences } from '../../../shared/preferences/preferences-context'
import { DEFAULT_RANGE, isRangePreset, resolveRange, type DateRange, type RangePresetKey } from '../config/date-range'

/** The selected range lives in the URL (?range=30d) so tabs, reloads and shared links agree. */
export function useDateRange(): [DateRange, (preset: RangePresetKey) => void] {
  const [params, setParams] = useSearchParams()
  const saved = usePreferences().prefs.display.date_range
  const fallback = isRangePreset(saved) ? saved : DEFAULT_RANGE
  const raw = params.get('range')
  const preset = isRangePreset(raw) ? raw : fallback
  const range = useMemo(() => resolveRange(preset), [preset])

  const setPreset = (next: RangePresetKey) => {
    const nextParams = new URLSearchParams(params)
    if (next === fallback) nextParams.delete('range')
    else nextParams.set('range', next)
    setParams(nextParams, { replace: true })
  }

  return [range, setPreset]
}
