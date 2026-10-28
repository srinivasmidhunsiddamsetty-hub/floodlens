import { describe, expect, it } from 'vitest'
import { initialState, nearestScenario, reducer, type AppState } from './reducer'

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

describe('view state', () => {
  it('starts with flood extent, buildings and labels on, low-lying off', () => {
    expect(initialState.layers).toEqual({ inundation: true, buildings: true, labels: true, lowLying: false })
  })

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
