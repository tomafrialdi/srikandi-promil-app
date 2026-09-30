import { useState } from 'react'
import type { DraftOp, ModeConfig, ModeKey, Weights } from '../types'

/** Local, unsaved edits to one mode's weights, parameter values and toggles. */
export function useModeEdits(mode: ModeKey, server: ModeConfig) {
  const [weights, setWeights] = useState<Weights>(server.weights)
  const [params, setParams] = useState<Record<string, string>>({})
  const [toggles, setToggles] = useState<Record<string, boolean>>({})

  const weightsDirty = JSON.stringify(weights) !== JSON.stringify(server.weights)
  const paramKeys = Object.keys(params).filter((k) => params[k] !== server.params.find((p) => p.key === k)?.value)
  const toggleKeys = Object.keys(toggles).filter((k) => {
    const [group, key] = k.split(':') as ['notifications' | 'features', string]
    return toggles[k] !== server[group].find((t) => t.key === key)?.enabled
  })
  const dirty = weightsDirty || paramKeys.length > 0 || toggleKeys.length > 0

  const ops = (): DraftOp[] => {
    const list: DraftOp[] = []
    if (weightsDirty) list.push({ op: 'set_weights', mode, weights })
    if (paramKeys.length) list.push({ op: 'set_params', mode, params: paramKeys.map((key) => ({ key, value: params[key]! })) })
    for (const k of toggleKeys) {
      const [group, key] = k.split(':') as ['notifications' | 'features', string]
      list.push({ op: 'set_toggle', mode, group, key, enabled: toggles[k]! })
    }
    return list
  }

  return {
    weights,
    setWeight: (key: keyof Weights, value: number) => setWeights((w) => ({ ...w, [key]: value })),
    paramValue: (key: string) => params[key] ?? server.params.find((p) => p.key === key)?.value ?? '',
    setParam: (key: string, value: string) => setParams((p) => ({ ...p, [key]: value })),
    toggleValue: (group: 'notifications' | 'features', key: string) => toggles[`${group}:${key}`] ?? server[group].find((t) => t.key === key)?.enabled ?? false,
    setToggle: (group: 'notifications' | 'features', key: string, value: boolean) => setToggles((t) => ({ ...t, [`${group}:${key}`]: value })),
    dirty,
    ops,
    reset: () => {
      setWeights(server.weights)
      setParams({})
      setToggles({})
    },
  }
}
