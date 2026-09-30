import { useAsyncData } from '../../../shared/hooks/useAsyncData'
import { fetchEngineState, fetchGoldenCases } from '../services/engine.service'

export const useEngineState = () => useAsyncData('engine-state', fetchEngineState)
export const useGoldenCases = () => useAsyncData('engine-golden', fetchGoldenCases)
