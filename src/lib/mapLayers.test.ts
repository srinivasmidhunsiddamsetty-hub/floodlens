import { describe, expect, it } from 'vitest'
import { buildingLevel3dId, buildingLevelFlatId, setBuildingColors, setBuildingLevel } from './mapLayers'
import { BAND_COLORS, SIMPLE_BUILDING_COLOR } from './theme'

/** A stand-in for the map that records each layer's latest paint values. */
function fakeMap() {
  const paint = new Map<string, unknown>()
  return {
    paint,
    getLayer: () => ({}) as never,
    setPaintProperty: (id: string, name: string, value: unknown) => {
      paint.set(`${id} ${name}`, value)
      return undefined as never
    },
  }
}

describe('setBuildingLevel (v0.62)', () => {
  const opacity3d = (m: ReturnType<typeof fakeMap>, ft: number) => m.paint.get(`${buildingLevel3dId(ft)} fill-extrusion-opacity`)
  const opacityFlat = (m: ReturnType<typeof fakeMap>, ft: number) => m.paint.get(`${buildingLevelFlatId(ft)} fill-opacity`)

  it('colours only the buildings the chosen level has reached, in 3D and in 2D', () => {
    const map = fakeMap()
    setBuildingLevel(map, 3)
    for (const ft of [0, 1, 2, 3]) {
      expect(opacity3d(map, ft)).toBe(1)
      expect(opacityFlat(map, ft)).toBeGreaterThan(0)
    }
    for (const ft of [4, 5]) {
      expect(opacity3d(map, ft)).toBe(0)
      expect(opacityFlat(map, ft)).toBe(0)
    }
  })

  it('returns buildings to plain when the slider comes back down', () => {
    const map = fakeMap()
    setBuildingLevel(map, 5)
    setBuildingLevel(map, 0)
    expect(opacity3d(map, 0)).toBe(1)
    expect(opacity3d(map, 1)).toBe(0)
    expect(opacity3d(map, 5)).toBe(0)
  })
})

describe('setBuildingColors (v0.63)', () => {
  const levels = [0, 1, 2, 3, 4, 5]

  it('gives every reached building one blue with Overall colours, in 3D and in 2D', () => {
    const map = fakeMap()
    setBuildingColors(map, 'simple')
    for (const ft of levels) {
      expect(map.paint.get(`${buildingLevel3dId(ft)} fill-extrusion-color`)).toBe(SIMPLE_BUILDING_COLOR)
      expect(map.paint.get(`${buildingLevelFlatId(ft)} fill-color`)).toBe(SIMPLE_BUILDING_COLOR)
    }
  })

  it('gives each level its own colour with Per foot colours', () => {
    const map = fakeMap()
    setBuildingColors(map, 'detailed')
    for (const ft of levels) {
      expect(map.paint.get(`${buildingLevel3dId(ft)} fill-extrusion-color`)).toBe(BAND_COLORS[ft])
      expect(map.paint.get(`${buildingLevelFlatId(ft)} fill-color`)).toBe(BAND_COLORS[ft])
    }
  })
})
