import { describe, expect, it } from 'vitest'
import { buildingLevel3dId, buildingLevelFlatId, setBuildingLevel } from './mapLayers'

/** A stand-in for the map that records each layer's latest opacity. */
function fakeMap() {
  const opacity = new Map<string, unknown>()
  return {
    opacity,
    getLayer: () => ({}) as never,
    setPaintProperty: (id: string, _name: string, value: unknown) => {
      opacity.set(id, value)
      return undefined as never
    },
  }
}

describe('setBuildingLevel (v0.62)', () => {
  it('colours only the buildings the chosen level has reached, in 3D and in 2D', () => {
    const map = fakeMap()
    setBuildingLevel(map, 3)
    for (const ft of [0, 1, 2, 3]) {
      expect(map.opacity.get(buildingLevel3dId(ft))).toBe(1)
      expect(map.opacity.get(buildingLevelFlatId(ft))).toBeGreaterThan(0)
    }
    for (const ft of [4, 5]) {
      expect(map.opacity.get(buildingLevel3dId(ft))).toBe(0)
      expect(map.opacity.get(buildingLevelFlatId(ft))).toBe(0)
    }
  })

  it('returns buildings to plain when the slider comes back down', () => {
    const map = fakeMap()
    setBuildingLevel(map, 5)
    setBuildingLevel(map, 0)
    expect(map.opacity.get(buildingLevel3dId(0))).toBe(1)
    expect(map.opacity.get(buildingLevel3dId(1))).toBe(0)
    expect(map.opacity.get(buildingLevel3dId(5))).toBe(0)
  })
})
