import type { Position } from 'geojson'
import { describe, expect, it } from 'vitest'
import turfArea from '@turf/area'
import { expandFootprint, expandRing, firstPrismHit, pointInRings, rejoinTileSplit, unionPieces, type Prism } from './buildingPick'

const square = (x: number, y: number, s: number): Position[][] => [
  [
    [x, y],
    [x + s, y],
    [x + s, y + s],
    [x, y + s],
    [x, y],
  ],
]

describe('pointInRings', () => {
  it('handles holes', () => {
    const donut = [...square(0, 0, 10), ...square(4, 4, 2)]
    expect(pointInRings(1, 1, donut)).toBe(true)
    expect(pointInRings(5, 5, donut)).toBe(false)
    expect(pointInRings(11, 1, donut)).toBe(false)
  })
})

describe('firstPrismHit — oblique click picks the building in front, not the ground behind it', () => {
  // Camera high and to the south (low y), looking north; ground hit lands behind (north of) a tall building.
  const camera = { x: 5, y: -20, z: 30 }
  const ground = { x: 5, y: 20, z: 0 }
  const tall: Prism = { rings: square(4, 8, 2), baseZ: 0, topZ: 15 }
  const behind: Prism = { rings: square(4, 19, 2), baseZ: 0, topZ: 1 }

  it('returns the tall building the ray enters first', () => {
    expect(firstPrismHit(camera, ground, [behind, tall])).toBe(1)
  })

  it('falls back to the building at the ground point when nothing is in front', () => {
    expect(firstPrismHit(camera, ground, [behind])).toBe(0)
  })

  it('misses when the ray passes over a low building', () => {
    const low: Prism = { rings: square(4, 8, 2), baseZ: 0, topZ: 0.5 }
    expect(firstPrismHit(camera, ground, [low])).toBe(-1)
  })

  it('works for a straight-down (2D) view', () => {
    expect(firstPrismHit({ x: 5, y: 9, z: 100 }, { x: 5, y: 9, z: 0 }, [tall])).toBe(0)
  })
})

describe('rejoinTileSplit — re-joins tile-split buildings without swallowing neighbours', () => {
  // ~0.0002° ≈ 20 m squares near Miami
  const d = 0.0002
  const seed = square(-80.13, 25.78, d)
  // Tile-split twin: overlaps the seed by a 25% strip (tile buffer)
  const twin = square(-80.13 + d * 0.75, 25.78, d)
  // Terraced neighbour: shares an edge with the seed but does not overlap
  const neighbour = square(-80.13, 25.78 + d, d)
  const far = square(-80.12, 25.79, d)

  it('joins overlapping pieces and ignores touching or distant buildings', () => {
    const out = rejoinTileSplit(seed, [far, neighbour, twin])
    expect(out).toHaveLength(2)
    expect(out).toContainEqual(twin)
    expect(out).not.toContainEqual(neighbour)
  })

  it('unions pieces into a single footprint', () => {
    const u = unionPieces([seed, twin])
    expect(u.geometry.type).toBe('Polygon')
  })
})

describe('expandRing', () => {
  const kx = 111_320 * Math.cos((25.7801 * Math.PI) / 180)
  const ky = 110_540

  it('moves every wall outward by the requested distance', () => {
    const ring = square(-80.13, 25.78, 0.0002)[0]
    const out = expandRing(ring, 0.5)
    // Both opposite walls move 0.5 m, so the width grows by 1 m.
    expect((out[1][0] - out[0][0] - (ring[1][0] - ring[0][0])) * kx).toBeCloseTo(1, 1)
    expect((out[2][1] - out[1][1] - (ring[2][1] - ring[1][1])) * ky).toBeCloseTo(1, 1)
    expect(out[0]).toEqual(out[out.length - 1])
  })

  it('moves the walls of a notch outward too, whichever way the ring runs (v0.62)', () => {
    // A square with a notch cut into its top edge: the notch's walls face the ring's centre, so a
    // push away from the centre would move them into the building.
    const [x, y, s] = [-80.13, 25.78, 0.0002]
    const notched: Position[] = [
      [x, y],
      [x + s, y],
      [x + s, y + s],
      [x + s * 0.6, y + s],
      [x + s * 0.6, y + s * 0.5],
      [x + s * 0.4, y + s * 0.5],
      [x + s * 0.4, y + s],
      [x, y + s],
      [x, y],
    ]
    for (const ring of [notched, [...notched].reverse()]) {
      const out = expandRing(ring, 0.5)
      for (const [i, p] of out.slice(0, -1).entries()) {
        // Every new corner lies outside the original building.
        expect(pointInRings(p[0], p[1], [ring]), `corner ${i}`).toBe(false)
      }
    }
    // The notch's floor rises 0.5 m, as the building grows into it.
    const floor = expandRing(notched, 0.5)[4][1]
    expect((floor - notched[4][1]) * ky).toBeCloseTo(0.5, 1)
  })

  it('makes the whole footprint larger, with courtyards smaller', () => {
    const donut = [...square(-80.13, 25.78, 0.0004), ...square(-80.1299, 25.7801, 0.0002).map((r) => [...r].reverse())]
    const f = { type: 'Feature' as const, properties: {}, geometry: { type: 'Polygon' as const, coordinates: donut } }
    const grown = expandFootprint(f, 0.5)
    expect(turfArea(grown)).toBeGreaterThan(turfArea(f))
    const courtyard = { ...f, geometry: { type: 'Polygon' as const, coordinates: [donut[1]] } }
    const grownCourtyard = { ...f, geometry: { type: 'Polygon' as const, coordinates: [(grown.geometry.coordinates as Position[][])[1]] } }
    expect(turfArea(grownCourtyard)).toBeLessThan(turfArea(courtyard))
  })
})
