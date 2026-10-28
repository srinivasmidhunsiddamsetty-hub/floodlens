import type { Feature, Polygon } from 'geojson'
import { describe, expect, it } from 'vitest'
import type { ExtentCollection } from '../types/data'
import { collectionAreaM2, distanceToLineM, featureAtPoint, featureIntersecting, isInsideArea, outsideMask, probeScenarios } from './geo'

/** Axis-aligned square in lon/lat degrees. */
function square(w: number, s: number, size: number, props = {}): Feature<Polygon> {
  return {
    type: 'Feature',
    properties: props,
    geometry: { type: 'Polygon', coordinates: [[[w, s], [w + size, s], [w + size, s + size], [w, s + size], [w, s]]] },
  }
}
const fc = (...features: Feature<Polygon>[]) => ({ type: 'FeatureCollection', features }) as unknown as ExtentCollection

describe('collectionAreaM2 — numeric calculations', () => {
  it('computes geodesic area, not square degrees', () => {
    // 0.01° × 0.01° at the equator ≈ 1.113 km × 1.106 km ≈ 1.2364 km² (spherical)
    const a = collectionAreaM2(fc(square(0, 0, 0.01)))
    expect(a / 1e6).toBeCloseTo(1.2364, 2)
  })

  it('shrinks with latitude as meridians converge (Miami ≈ cos 25.8°)', () => {
    const equator = collectionAreaM2(fc(square(0, 0, 0.01)))
    const miami = collectionAreaM2(fc(square(-80.14, 25.78, 0.01)))
    expect(miami / equator).toBeCloseTo(Math.cos((25.785 * Math.PI) / 180), 3)
  })

  it('sums multiple features', () => {
    const one = collectionAreaM2(fc(square(0, 0, 0.01)))
    expect(collectionAreaM2(fc(square(0, 0, 0.01), square(1, 0, 0.01)))).toBeCloseTo(2 * one, 0)
  })
})

describe('point / footprint queries', () => {
  const layer = fc(square(0, 0, 1, { id: 'a' }), square(2, 0, 1, { id: 'b' }))

  it('finds the containing feature', () => {
    expect(featureAtPoint(layer, [0.5, 0.5])?.properties).toEqual({ id: 'a' })
    expect(featureAtPoint(layer, [2.5, 0.5])?.properties).toEqual({ id: 'b' })
    expect(featureAtPoint(layer, [1.5, 0.5])).toBeNull()
    expect(featureAtPoint(null, [0.5, 0.5])).toBeNull()
  })

  it('detects footprints that only partially overlap', () => {
    expect(featureIntersecting(layer, square(0.9, 0.9, 0.5))?.properties).toEqual({ id: 'a' })
    expect(featureIntersecting(layer, square(1.2, 0.2, 0.3))).toBeNull()
  })

  it('reports per-scenario membership and the lowest scenario hit', () => {
    const extents = new Map([
      [0, fc(square(0, 0, 0.1))],
      [1, fc(square(0, 0, 0.5))],
      [2, fc(square(0, 0, 1))],
    ])
    expect(probeScenarios(extents, { point: [0.3, 0.3] })).toEqual({
      hits: [
        { feet: 0, within: false },
        { feet: 1, within: true },
        { feet: 2, within: true },
      ],
      firstFeet: 1,
    })
    expect(probeScenarios(extents, { point: [5, 5] }).firstFeet).toBeNull()
  })
})

describe('distanceToLineM', () => {
  it('measures perpendicular distance to a segment in metres', () => {
    // 0.001° of latitude ≈ 111.2 m
    const d = distanceToLineM([0, 0.001], [[-0.01, 0], [0.01, 0]])
    expect(d).toBeGreaterThan(110)
    expect(d).toBeLessThan(112.5)
  })

  it('clamps to segment endpoints', () => {
    const d = distanceToLineM([0.002, 0], [[-0.01, 0], [0.001, 0]])
    expect(d).toBeCloseTo(111.2, 0)
  })
})

describe('outsideMask / isInsideArea', () => {
  const area: Feature<Polygon> = {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [
        [[-80.16, 25.76], [-80.12, 25.76], [-80.12, 25.8], [-80.16, 25.8], [-80.16, 25.76]],
        [[-80.15, 25.77], [-80.15, 25.78], [-80.14, 25.78], [-80.14, 25.77], [-80.15, 25.77]],
      ],
    },
  }

  it('cuts the study area out of a world polygon and masks its holes', () => {
    const m = outsideMask(area)
    expect(m.geometry.coordinates).toHaveLength(2)
    expect(m.geometry.coordinates[0]).toHaveLength(2)
    expect(m.geometry.coordinates[0][1]).toContainEqual([-80.16, 25.76])
    expect(m.geometry.coordinates[1][0]).toContainEqual([-80.15, 25.77])
  })

  it('tests points against the real outline, not its bounding box', () => {
    expect(isInsideArea([-80.13, 25.79], area)).toBe(true)
    expect(isInsideArea([-80.145, 25.775], area)).toBe(false)
    expect(isInsideArea([-80.1, 25.79], area)).toBe(false)
  })
})
