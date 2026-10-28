/**
 * Building picking for 3D maps.
 *
 * Why this exists: in an oblique view, a click on a roof unprojects to the
 * ground *behind* the building, and the vector tiles merge many neighbouring
 * buildings into one MultiPolygon. To find the building the user actually
 * clicked we follow the view ray from the camera to the ground and return the
 * first building "prism" (footprint × [base, top] height) it enters.
 *
 * All functions are pure and work in Web-Mercator units (MapLibre
 * MercatorCoordinate space: x, y in [0, 1], z = altitude in the same units).
 */
import turfArea from '@turf/area'
import { featureCollection } from '@turf/helpers'
import intersect from '@turf/intersect'
import union from '@turf/union'
import type { Feature, MultiPolygon, Polygon, Position } from 'geojson'

export interface XYZ {
  x: number
  y: number
  z: number
}

export interface Prism {
  /** Footprint rings in mercator x/y (outer ring first). */
  rings: Position[][]
  baseZ: number
  topZ: number
}

/** Even-odd point-in-polygon over all rings (holes handled naturally). */
export function pointInRings(x: number, y: number, rings: Position[][]): boolean {
  let inside = false
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i]
      const [xj, yj] = ring[j]
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside
    }
  }
  return inside
}

/**
 * Index of the prism the ray camera → ground enters first, or -1.
 * Samples the part of the ray that lies within each prism's height range.
 */
export function firstPrismHit(camera: XYZ, ground: XYZ, prisms: Prism[], samples = 96): number {
  let best = -1
  let bestS = Infinity
  const cz = Math.max(camera.z, 1e-12)
  prisms.forEach((p, idx) => {
    // Ray altitude z(s) = cz · (1 − s); inside the prism's height band when base ≤ z ≤ top.
    const sStart = Math.max(0, 1 - p.topZ / cz)
    const sEnd = Math.min(1, 1 - p.baseZ / cz)
    if (sStart > sEnd || sStart >= bestS) return
    for (let k = 0; k <= samples; k++) {
      const s = sStart + ((sEnd - sStart) * k) / samples
      if (s >= bestS) break
      const x = camera.x + (ground.x - camera.x) * s
      const y = camera.y + (ground.y - camera.y) * s
      if (pointInRings(x, y, p.rings)) {
        bestS = s
        best = idx
        break
      }
    }
  })
  return best
}

const bbox = (rings: Position[][]) => {
  let [w, s, e, n] = [Infinity, Infinity, -Infinity, -Infinity]
  for (const r of rings)
    for (const [x, y] of r) {
      if (x < w) w = x
      if (x > e) e = x
      if (y < s) s = y
      if (y > n) n = y
    }
  return [w, s, e, n] as const
}

const asPolygon = (rings: Position[][]): Feature<Polygon> => ({
  type: 'Feature',
  properties: {},
  geometry: { type: 'Polygon', coordinates: rings },
})

/**
 * Re-join a building that the vector-tile grid split into pieces.
 *
 * Tiles carry a buffer beyond their edge, so the two halves of a split
 * building *overlap* by a strip of real area — while separate neighbouring
 * buildings (e.g. terraced houses) only *touch*. Starting from `seed` (lng/lat
 * rings), collect every polygon in `pool` that overlaps an already-collected
 * piece by more than `minOverlapM2`.
 */
export function rejoinTileSplit(seed: Position[][], pool: Position[][][], minOverlapM2 = 1, maxParts = 8): Position[][][] {
  const out = [seed]
  const remaining = pool.filter((p) => p !== seed)
  let frontier = [seed]
  while (frontier.length && out.length < maxParts) {
    const next: Position[][][] = []
    for (let i = remaining.length - 1; i >= 0; i--) {
      const cand = remaining[i]
      const cb = bbox(cand)
      const overlaps = frontier.some((f) => {
        const fb = bbox(f)
        if (cb[0] > fb[2] || cb[2] < fb[0] || cb[1] > fb[3] || cb[3] < fb[1]) return false
        const inter = intersect(featureCollection([asPolygon(f), asPolygon(cand)]))
        return !!inter && turfArea(inter) > minOverlapM2
      })
      if (overlaps) {
        out.push(cand)
        next.push(cand)
        remaining.splice(i, 1)
      }
    }
    frontier = next
  }
  return out
}

/** Union of polygon pieces → one footprint feature (Polygon or MultiPolygon). */
export function unionPieces(pieces: Position[][][]): Feature<Polygon | MultiPolygon> {
  if (pieces.length === 1) return asPolygon(pieces[0])
  const u = union(featureCollection(pieces.map(asPolygon)))
  return (u as Feature<Polygon | MultiPolygon> | null) ?? asPolygon(pieces[0])
}

/**
 * Push every vertex ~`meters` away from the ring centre. The selection
 * highlight is drawn slightly larger (and taller) than the building so the two
 * surfaces never coincide — coincident faces z-fight and flicker while zooming.
 */
export function expandRing(ring: Position[], meters: number): Position[] {
  const n = ring.length - 1 || 1
  let cx = 0
  let cy = 0
  for (let i = 0; i < n; i++) {
    cx += ring[i][0]
    cy += ring[i][1]
  }
  cx /= n
  cy /= n
  const kx = 111_320 * Math.cos((cy * Math.PI) / 180)
  const ky = 110_540
  return ring.map(([x, y]) => {
    const dx = (x - cx) * kx
    const dy = (y - cy) * ky
    const r = Math.hypot(dx, dy) || 1
    const f = (r + meters) / r
    return [cx + (dx * f) / kx, cy + (dy * f) / ky]
  })
}

export function expandFootprint(f: Feature<Polygon | MultiPolygon>, meters: number): Feature<Polygon | MultiPolygon> {
  const g = f.geometry
  return g.type === 'Polygon'
    ? { ...f, geometry: { type: 'Polygon', coordinates: g.coordinates.map((r) => expandRing(r, meters)) } }
    : { ...f, geometry: { type: 'MultiPolygon', coordinates: g.coordinates.map((p) => p.map((r) => expandRing(r, meters))) } }
}
