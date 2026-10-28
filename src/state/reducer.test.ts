import { describe, expect, it } from 'vitest'
import { comparePair, initialState, nearestScenario, pickComparePartner, reducer, type AppState } from './reducer'

const loaded = (over: Partial<AppState> = {}): AppState =>
  reducer({ ...initialState, ...over }, { type: 'manifestLoaded', available: [3, 0, 2, 1] })

describe('scenario selection', () => {
  it('sorts available scenarios and keeps a valid default', () => {
    const s = loaded()
    expect(s.available).toEqual([0, 1, 2, 3])
    expect(s.scenarioFt).toBe(2)
  })

  it('snaps an unavailable default to the nearest scenario', () => {
    const s = reducer({ ...initialState, scenarioFt: 2 }, { type: 'manifestLoaded', available: [0, 1, 3] })
    expect(s.scenarioFt).toBe(1) // tie between 1 and 3 resolves low
    expect(nearestScenario([0, 1, 3], 2.6)).toBe(3)
  })

  it('selects only scenarios that exist', () => {
    const s = loaded()
    expect(reducer(s, { type: 'setScenario', feet: 3 }).scenarioFt).toBe(3)
    expect(reducer(s, { type: 'setScenario', feet: 7 })).toBe(s)
  })

  it('steps between neighbours and stops at the ends', () => {
    let s = loaded({ scenarioFt: 2 })
    s = reducer(s, { type: 'stepScenario', delta: 1 })
    expect(s.scenarioFt).toBe(3)
    expect(reducer(s, { type: 'stepScenario', delta: 1 })).toBe(s)
    s = reducer(reducer(reducer(s, { type: 'stepScenario', delta: -1 }), { type: 'stepScenario', delta: -1 }), {
      type: 'stepScenario',
      delta: -1,
    })
    expect(s.scenarioFt).toBe(0)
  })

  it('preserves everything else (camera, layers, selection) when the scenario changes', () => {
    const s = { ...loaded(), cameraResetToken: 4, viewMode: '2d' as const }
    const next = reducer(s, { type: 'setScenario', feet: 1 })
    expect(next.cameraResetToken).toBe(4)
    expect(next.viewMode).toBe('2d')
    expect(next.layers).toBe(s.layers)
  })
})

describe('comparison state', () => {
  it('orders the pair low → high', () => {
    let s = loaded({ scenarioFt: 1 })
    s = reducer(s, { type: 'setCompareEnabled', enabled: true })
    s = reducer(s, { type: 'setCompareWith', feet: 3 })
    expect(comparePair(s)).toEqual([1, 3])
    s = reducer(s, { type: 'setScenario', feet: 3 })
    // partner can't equal the scenario: falls back to the next lower one
    expect(s.compare.withFt).toBe(2)
    expect(comparePair(s)).toEqual([2, 3])
  })

  it('is null while disabled', () => {
    expect(comparePair(loaded())).toBeNull()
  })

  it('ignores a partner equal to the scenario or not available', () => {
    const s = reducer(loaded({ scenarioFt: 2 }), { type: 'setCompareEnabled', enabled: true })
    expect(reducer(s, { type: 'setCompareWith', feet: 2 })).toBe(s)
    expect(reducer(s, { type: 'setCompareWith', feet: 9 })).toBe(s)
  })

  it('picks a partner below, else above', () => {
    expect(pickComparePartner([0, 1, 2, 3], 0, 0)).toBe(1)
    expect(pickComparePartner([0, 1, 2, 3], 2, 2)).toBe(1)
    expect(pickComparePartner([0, 1, 2, 3], 2, 0)).toBe(0)
  })

  it('cannot be enabled with fewer than two scenarios', () => {
    const s = reducer(initialState, { type: 'manifestLoaded', available: [1] })
    expect(reducer(s, { type: 'setCompareEnabled', enabled: true }).compare.enabled).toBe(false)
  })
})

describe('view state', () => {
  it('toggles layers independently', () => {
    const s = reducer(loaded(), { type: 'toggleLayer', layer: 'buildings' })
    expect(s.layers.buildings).toBe(false)
    expect(s.layers.inundation).toBe(true)
  })

  it('reset camera returns to 3D and bumps the token', () => {
    const s = reducer({ ...loaded(), viewMode: '2d' }, { type: 'resetCamera' })
    expect(s.viewMode).toBe('3d')
    expect(s.cameraResetToken).toBe(1)
  })

  it('switching view mode keeps the scenario', () => {
    const s = reducer(loaded({ scenarioFt: 3 }), { type: 'setViewMode', mode: '2d' })
    expect(s).toMatchObject({ viewMode: '2d', scenarioFt: 3 })
  })
})
