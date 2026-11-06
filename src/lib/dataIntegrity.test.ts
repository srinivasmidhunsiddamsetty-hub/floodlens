/**
 * Cross-checks the processed NOAA files against the manifest. The pipeline
 * measures areas on the WGS84 ellipsoid (pyproj.Geod); Turf uses a sphere, so
 * agreement within 0.5% confirms both the files and the published numbers.
 */
import { describe, expect, it } from 'vitest'
import { realCollection, realManifestJson } from '../test/fixtures'
import type { Feature, MultiPolygon, Polygon } from 'geojson'
import type { ExtentCollection } from '../types/data'
import { expandFootprint, LEVEL_OVERLAY_GROW_M } from './buildingPick'
import { BUILDING_LEVELS_FILE } from './constants'
import { collectionAreaM2, featureAtPoint, isInsideArea, probeScenarios, type LngLat } from './geo'
import { parseManifest } from './manifest'
import turfCentroid from '@turf/centroid'

const manifest = parseManifest(realManifestJson())
const rel = (a: number, b: number) => Math.abs(a - b) / Math.max(a, b)

describe('processed NOAA data integrity', () => {
  it.each(manifest.scenarios.map((s) => [s.label, s] as const))('%s extent area matches the manifest', (_, s) => {
    const fc = realCollection(s.file)
    expect(fc.type).toBe('FeatureCollection')
    expect(fc.features.length).toBe(s.featureCount)
    expect(rel(collectionAreaM2(fc), s.areaM2)).toBeLessThan(0.005)
  })

  it.each(manifest.comparisons.map((c) => [`${c.fromFt}→${c.toFt} ft`, c] as const))(
    'added extent %s matches the manifest and the change in totals',
    (_, c) => {
      const fc = realCollection(c.file)
      const area = collectionAreaM2(fc)
      expect(rel(area, c.areaM2)).toBeLessThan(0.005)
      const lo = manifest.scenarios.find((s) => s.feet === c.fromFt)!
      const hi = manifest.scenarios.find((s) => s.feet === c.toFt)!
      // Polygon difference area ≈ difference of total areas (lower ⊆ higher). Each extent is simplified
      // on its own, so the noise scales with the size of the extents, not the band: keep it within 0.5%
      // of the higher extent. (The pipeline checks the unsimplified difference to within 0.1%.)
      expect(Math.abs(c.areaM2 - (hi.areaM2 - lo.areaM2)) / hi.areaM2).toBeLessThan(0.005)
    },
  )

  it('mapped extent never shrinks as the water level rises', () => {
    const areas = manifest.scenarios.map((s) => s.areaM2)
    const beyond = manifest.scenarios.map((s) => s.beyondBaselineM2)
    for (let i = 1; i < areas.length; i++) {
      expect(areas[i]).toBeGreaterThanOrEqual(areas[i - 1])
      expect(beyond[i]).toBeGreaterThanOrEqual(beyond[i - 1])
    }
    expect(beyond[0]).toBe(0)
  })

  it('beyond-baseline areas equal the sum of the neighbouring bands up to that level', () => {
    expect(manifest.comparisons.map((c) => [c.fromFt, c.toFt])).toEqual(
      manifest.scenarios.slice(1).map((s, i) => [manifest.scenarios[i].feet, s.feet]),
    )
    let sum = 0
    for (const s of manifest.scenarios.filter((x) => x.feet > 0)) {
      sum += manifest.comparisons.find((x) => x.toFt === s.feet)!.areaM2
      // Each band is simplified separately, so allow simplification noise.
      expect(rel(s.beyondBaselineM2, sum)).toBeLessThan(0.01)
    }
  })

  it('every coordinate lies inside the study area and uses lon/lat order', () => {
    const [w, s, e, n] = manifest.studyArea.bbox
    for (const meta of [...manifest.scenarios, ...manifest.comparisons, ...manifest.lowLying]) {
      let [minX, minY, maxX, maxY] = [Infinity, Infinity, -Infinity, -Infinity]
      for (const f of realCollection(meta.file).features) {
        const rings = f.geometry.type === 'Polygon' ? f.geometry.coordinates : f.geometry.coordinates.flat()
        for (const ring of rings)
          for (const [x, y] of ring) {
            minX = Math.min(minX, x)
            maxX = Math.max(maxX, x)
            minY = Math.min(minY, y)
            maxY = Math.max(maxY, y)
          }
      }
      expect({ file: meta.file, inside: minX >= w - 1e-6 && maxX <= e + 1e-6 && minY >= s - 1e-6 && maxY <= n + 1e-6 }).toEqual({
        file: meta.file,
        inside: true,
      })
    }
  }, 30_000)

  it('a point inside the +1 ft added extent is outside 1 ft and inside 2 ft', () => {
    const diff = realCollection('diff_1ft_2ft.geojson')
    // Largest added patch: probe one of its vertices nudged toward the centroid of its bbox.
    const ring = diff.features[0].geometry.type === 'Polygon' ? diff.features[0].geometry.coordinates[0] : []
    const xs = ring.map((p) => p[0])
    const ys = ring.map((p) => p[1])
    const candidates: [number, number][] = []
    for (let i = 1; i < 40; i++)
      for (let j = 1; j < 40; j++)
        candidates.push([
          Math.min(...xs) + ((Math.max(...xs) - Math.min(...xs)) * i) / 40,
          Math.min(...ys) + ((Math.max(...ys) - Math.min(...ys)) * j) / 40,
        ])
    const pt = candidates.find((p) => featureAtPoint(diff, p))
    expect(pt).toBeDefined()
    expect(featureAtPoint(realCollection('slr_1ft.geojson'), pt!)).toBeNull()
    expect(featureAtPoint(realCollection('slr_2ft.geojson'), pt!)).not.toBeNull()
  })
})

describe('building levels (v0.62)', () => {
  type Building = Feature<Polygon | MultiPolygon, { r: number; h: number; b: number; x?: number }>
  const file = realCollection(BUILDING_LEVELS_FILE) as unknown as ExtentCollection & {
    metadata: { buildingsInCity: number; counts: Record<string, number>; growM: number }
  }
  const buildings = file.features as unknown as Building[]

  it('lists a real level, height and base for each building, and adds up to the file’s own counts', () => {
    const { counts, buildingsInCity, growM } = file.metadata
    expect(growM).toBe(LEVEL_OVERLAY_GROW_M)
    for (const ft of [0, 1, 2, 3, 4, 5]) {
      expect(buildings.filter((b) => b.properties.r === ft)).toHaveLength(counts[ft])
    }
    expect(buildings).toHaveLength(buildingsInCity - counts.notReached)
    for (const b of buildings) {
      expect(b.properties.h).toBeGreaterThanOrEqual(b.properties.b)
    }
  })

  it('only holds buildings inside the city limits', () => {
    const area = realCollection(manifest.studyArea.file).features[0]
    const outside = buildings.filter((_, i) => i % 40 === 0).filter((b) => !isInsideArea(turfCentroid(b).geometry.coordinates as LngLat, area))
    expect(outside).toHaveLength(0)
  })

  it(
    'gives each building the level the place card would, on the card’s own rule',
    () => {
      const extents = new Map(manifest.scenarios.map((s) => [s.feet, realCollection(s.file)]))
      const point: LngLat = [0, 0] // unused: a footprint takes priority
      for (const ft of [0, 1, 2, 3, 4, 5]) {
        const atLevel = buildings.filter((b) => b.properties.r === ft)
        for (const b of [atLevel[0], atLevel[atLevel.length >> 1]]) {
          const footprint = expandFootprint(b, -LEVEL_OVERLAY_GROW_M)
          expect(probeScenarios(extents, { point, footprint }).firstFeet).toBe(ft)
        }
      }
    },
    60_000,
  )
})
