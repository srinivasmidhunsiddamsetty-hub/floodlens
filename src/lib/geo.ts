import turfArea from '@turf/area'
import booleanIntersects from '@turf/boolean-intersects'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import type { BBox, Feature, MultiPolygon, Polygon, Position } from 'geojson'
import type { ExtentCollection, ExtentFeature } from '../types/data'

export type LngLat = [number, number]

/** Geodesic area (m²) of every polygon in a collection — never computed from raw degrees. */
export function collectionAreaM2(fc: ExtentCollection): number {
  return fc.features.reduce((sum, f) => sum + turfArea(f), 0)
}

// ---------------------------------------------------------------------------
// Bounding boxes (cached per feature) make point-in-polygon tests cheap.
// ---------------------------------------------------------------------------

const bboxCache = new WeakMap<object, BBox>()

function ringsOf(geom: Polygon | MultiPolygon): Position[][] {
  return geom.type === 'Polygon' ? geom.coordinates : geom.coordinates.flat()
}

export function featureBBox(f: Feature<Polygon | MultiPolygon>): BBox {
  const hit = bboxCache.get(f)
  if (hit) return hit
  let w = Infinity
  let s = Infinity
  let e = -Infinity
  let n = -Infinity
  for (const ring of ringsOf(f.geometry)) {
    for (const [x, y] of ring) {
      if (x < w) w = x
      if (x > e) e = x
      if (y < s) s = y
      if (y > n) n = y
    }
  }
  const box: BBox = [w, s, e, n]
  bboxCache.set(f, box)
  return box
}

export const bboxContains = ([w, s, e, n]: BBox, [x, y]: LngLat) => x >= w && x <= e && y >= s && y <= n

const bboxOverlaps = (a: BBox, b: BBox) => a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1]

/** First feature in the collection that contains the point, or null. */
export function featureAtPoint(fc: ExtentCollection | null | undefined, pt: LngLat): ExtentFeature | null {
  if (!fc) return null
  for (const f of fc.features) {
    if (bboxContains(featureBBox(f), pt) && booleanPointInPolygon(pt, f)) return f
  }
  return null
}

/** First feature in the collection that intersects a footprint polygon, or null. */
export function featureIntersecting(
  fc: ExtentCollection | null | undefined,
  footprint: Feature<Polygon | MultiPolygon>,
): ExtentFeature | null {
  if (!fc) return null
  const fb = featureBBox(footprint)
  for (const f of fc.features) {
    if (bboxOverlaps(featureBBox(f), fb) && booleanIntersects(f, footprint)) return f
  }
  return null
}

export interface ScenarioHit {
  feet: number
  within: boolean
}

/**
 * For each scenario (ascending), whether the probe (point or footprint) falls
 * inside that scenario's mapped extent, plus the lowest scenario where it does.
 */
export function probeScenarios(
  extents: Map<number, ExtentCollection>,
  probe: { point: LngLat; footprint?: Feature<Polygon | MultiPolygon> },
): { hits: ScenarioHit[]; firstFeet: number | null } {
  const feet = [...extents.keys()].sort((a, b) => a - b)
  const hits = feet.map((ft) => {
    const fc = extents.get(ft)
    const within = probe.footprint ? !!featureIntersecting(fc, probe.footprint) : !!featureAtPoint(fc, probe.point)
    return { feet: ft, within }
  })
  const first = hits.find((h) => h.within)
  return { hits, firstFeet: first ? first.feet : null }
}

// ---------------------------------------------------------------------------
// Distances — local equirectangular projection is accurate to well under 1%
// over the few hundred metres used for "nearest street" lookups.
// ---------------------------------------------------------------------------

const EARTH_RADIUS_M = 6_371_008.8

function toLocalMeters(origin: LngLat) {
  const k = Math.cos((origin[1] * Math.PI) / 180)
  return ([x, y]: Position): [number, number] => [
    ((x - origin[0]) * Math.PI * EARTH_RADIUS_M * k) / 180,
    ((y - origin[1]) * Math.PI * EARTH_RADIUS_M) / 180,
  ]
}

function segmentDistance(p: [number, number], a: [number, number], b: [number, number]): number {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len2 = dx * dx + dy * dy
  const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / len2))
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy))
}

/** Distance in metres from a point to a polyline (lng/lat coordinates). */
export function distanceToLineM(pt: LngLat, line: Position[]): number {
  const proj = toLocalMeters(pt)
  const p: [number, number] = [0, 0]
  let best = Infinity
  for (let i = 1; i < line.length; i++) {
    best = Math.min(best, segmentDistance(p, proj(line[i - 1]), proj(line[i])))
  }
  return line.length === 1 ? Math.hypot(...proj(line[0])) : best
}

export function bboxOf(bbox: [number, number, number, number]): Feature<Polygon> {
  const [w, s, e, n] = bbox
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [w, s],
          [e, s],
          [e, n],
          [w, n],
          [w, s],
        ],
      ],
    },
  }
}

type AreaFeature = Feature<Polygon | MultiPolygon>

const WORLD: Position[] = [
  [-180, -85],
  [180, -85],
  [180, 85],
  [-180, 85],
  [-180, -85],
]

/**
 * A world-sized polygon with the study area cut out — used to dim "no data" areas.
 * Every outer ring of the study area becomes a hole; any hole *in* the study area
 * (land outside city limits) becomes its own masked polygon.
 */
export function outsideMask(area: AreaFeature): Feature<MultiPolygon> {
  const polys = area.geometry.type === 'Polygon' ? [area.geometry.coordinates] : area.geometry.coordinates
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'MultiPolygon',
      coordinates: [[WORLD, ...polys.map((rings) => rings[0])], ...polys.flatMap((rings) => rings.slice(1).map((hole) => [hole]))],
    },
  }
}

export function isInsideArea(pt: LngLat, area: AreaFeature) {
  return bboxContains(featureBBox(area), pt) && booleanPointInPolygon(pt, area)
}
